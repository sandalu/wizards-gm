// Offseason engine — ages players (development curve), retires the old, expires
// contracts (→ free agents), adds a new REAL rookie class from the reserve, then
// builds the next season's draft order with a weighted lottery. DB layer.

import { prisma } from "@/lib/prisma";
import { ROSTER_SIZE, POSITIONS } from "@/lib/data/nba";
import { RESERVE } from "@/lib/data/reserve";
import { standingsForSeason } from "@/lib/seasonEngine";
import { runCpuUntilUserOrDone } from "@/lib/draftEngine";
import { autoAssignStartersForAll } from "@/lib/rosterEngine";

export const ROOKIE_CLASS_SIZE = 45;

const randi = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** Development curve: young players can break out, primes hold, vets decline. */
export function developOverall(ovr: number, age: number, potential: number): number {
  let delta: number;
  if (age < 24) delta = randi(-1, 4);
  else if (age <= 30) delta = randi(-1, 1);
  else if (age <= 34) delta = randi(-4, 0);
  else delta = randi(-7, -1);
  let n = ovr + delta;
  if (age < 26) n = Math.min(n, potential); // growth capped by potential while young
  return clamp(n, 40, 99);
}

/** Retirement probability rises with age, higher for low-rated players. */
export function shouldRetire(age: number, ovr: number): boolean {
  let base: number;
  if (age >= 40) base = 0.85;
  else if (age >= 38) base = 0.55;
  else if (age >= 36) base = 0.3;
  else if (age >= 34) base = 0.12;
  else return false;
  if (ovr < 70) base += 0.2;
  return Math.random() < base;
}

async function chunkedTx(ops: Promise<unknown>[] | unknown[]) {
  // ops are prisma promise-like builders; run in batched transactions.
  const SIZE = 100;
  for (let i = 0; i < ops.length; i += SIZE) {
    // @ts-expect-error prisma transaction accepts an array of PrismaPromise
    await prisma.$transaction(ops.slice(i, i + SIZE));
  }
}

/** Top-8 per conference by win% — the teams that made the playoffs. */
function playoffTeamIds(
  teams: { id: string; conference: string }[],
  standings: Record<string, { wins: number; losses: number }>,
): Set<string> {
  const pct = (id: string) => {
    const r = standings[id];
    return r && r.wins + r.losses > 0 ? r.wins / (r.wins + r.losses) : 0;
  };
  const set = new Set<string>();
  for (const conf of ["E", "W"]) {
    teams
      .filter((t) => t.conference === conf)
      .sort((a, b) => pct(b.id) - pct(a.id))
      .slice(0, 8)
      .forEach((t) => set.add(t.id));
  }
  return set;
}

/** Weighted lottery: worst record has the best odds; draw a full order. */
function lotteryDraw(worstToBest: string[]): string[] {
  const pool = worstToBest.map((id, i) => ({
    id,
    weight: worstToBest.length - i,
  }));
  const out: string[] = [];
  while (pool.length) {
    const total = pool.reduce((a, p) => a + p.weight, 0);
    let r = Math.random() * total;
    let k = 0;
    for (; k < pool.length; k++) {
      r -= pool[k].weight;
      if (r <= 0) break;
    }
    out.push(pool[Math.min(k, pool.length - 1)].id);
    pool.splice(Math.min(k, pool.length - 1), 1);
  }
  return out;
}

export interface OffseasonSummary {
  newYear: number;
  retired: number;
  rookies: number;
  fictional: number;
  vacancies: number;
}

/** Advance from a completed season into the next one. */
export async function advanceOffseason(oldSeasonId: string): Promise<OffseasonSummary | null> {
  const old = await prisma.season.findUnique({ where: { id: oldSeasonId } });
  if (!old) return null;
  const newYear = old.year + 1;

  const teams = await prisma.team.findMany({
    select: { id: true, conference: true },
  });
  const standings = await standingsForSeason(oldSeasonId);
  const playoffSet = playoffTeamIds(teams, standings);

  // 1. Age + develop + retire every active player.
  const active = await prisma.player.findMany({
    where: { retiredAt: null },
    select: { id: true, age: true, currentOverall: true, potential: true, careerStage: true },
  });
  const retiredIds = new Set<string>();
  const playerOps: unknown[] = [];
  for (const p of active) {
    const newAge = p.age + 1;
    if (shouldRetire(newAge, p.currentOverall)) {
      retiredIds.add(p.id);
      playerOps.push(
        prisma.player.update({ where: { id: p.id }, data: { age: newAge, retiredAt: newYear } }),
      );
    } else {
      const nOvr = developOverall(p.currentOverall, newAge, p.potential);
      let stage = p.careerStage;
      if (stage === "rookie" && newAge >= 24) stage = "prime";
      else if (stage === "prime" && newAge >= 32) stage = "veteran";
      playerOps.push(
        prisma.player.update({
          where: { id: p.id },
          data: { age: newAge, currentOverall: nOvr, careerStage: stage },
        }),
      );
    }
  }
  await chunkedTx(playerOps);

  // 2. Contracts: drop retired + expired, decrement the rest.
  const contracts = await prisma.contract.findMany({
    select: { id: true, playerId: true, yearsRemaining: true },
  });
  const contractOps: unknown[] = [];
  for (const c of contracts) {
    if (retiredIds.has(c.playerId) || c.yearsRemaining - 1 <= 0) {
      contractOps.push(prisma.contract.delete({ where: { id: c.id } }));
    } else {
      contractOps.push(
        prisma.contract.update({
          where: { id: c.id },
          data: { yearsRemaining: c.yearsRemaining - 1 },
        }),
      );
    }
  }
  await chunkedTx(contractOps);

  // 3a. Vacancies after churn + free-agent supply, so we can size the rookie
  //     class to guarantee every roster can refill to 15.
  const counts = await prisma.contract.groupBy({ by: ["teamId"], _count: { _all: true } });
  const roster: Record<string, number> = {};
  for (const c of counts) roster[c.teamId] = c._count._all;
  const vacancies: Record<string, number> = {};
  let totalVac = 0;
  for (const t of teams) {
    const v = Math.max(0, ROSTER_SIZE - (roster[t.id] ?? 0));
    vacancies[t.id] = v;
    totalVac += v;
  }
  const freeAgents = await prisma.player.count({
    where: { retiredAt: null, contract: { is: null } },
  });
  // At least ROOKIE_CLASS_SIZE, but enough that free agents + rookies >= vacancies.
  const classSize = Math.max(ROOKIE_CLASS_SIZE, totalVac - freeAgents);

  // 3b. New rookie class from the real reserve (names not already used).
  const existing = new Set(
    (await prisma.player.findMany({ select: { name: true } })).map((p) => p.name.toLowerCase()),
  );
  const fresh = RESERVE.filter((r) => !existing.has(r[0].toLowerCase())).slice(0, classSize);
  const rookieData = fresh.map(([name, position, ovr]) => ({
    name,
    position,
    birthYear: newYear - 19,
    age: 19,
    careerStage: "rookie",
    baseOverall: ovr,
    currentOverall: ovr,
    potential: Math.min(99, ovr + randi(4, 12)),
    isReal: true,
    retiredAt: null as number | null,
  }));
  let fictional = 0;
  if (rookieData.length < classSize) {
    fictional = classSize - rookieData.length;
    for (let i = 0; i < fictional; i++) {
      const ovr = randi(66, 74);
      rookieData.push({
        name: `Fictional Prospect ${newYear}-${i + 1}`,
        position: POSITIONS[randi(0, POSITIONS.length - 1)],
        birthYear: newYear - 19,
        age: 19,
        careerStage: "rookie",
        baseOverall: ovr,
        currentOverall: ovr,
        potential: Math.min(99, ovr + randi(5, 14)),
        isReal: false,
        retiredAt: null,
      });
    }
  }
  await prisma.player.createMany({ data: rookieData });

  // 4. New season row; ensure the old one is marked complete.
  const newSeason = await prisma.season.create({ data: { year: newYear } });
  await prisma.season.update({ where: { id: oldSeasonId }, data: { isComplete: true } });

  // 5. Offseason draft order (lottery for non-playoff teams, then reverse standings).
  const pct = (id: string) => {
    const r = standings[id];
    return r && r.wins + r.losses > 0 ? r.wins / (r.wins + r.losses) : 0;
  };
  const nonPlayoffWorstFirst = teams
    .filter((t) => !playoffSet.has(t.id))
    .sort((a, b) => pct(a.id) - pct(b.id))
    .map((t) => t.id);
  const playoffWorstFirst = teams
    .filter((t) => playoffSet.has(t.id))
    .sort((a, b) => pct(a.id) - pct(b.id))
    .map((t) => t.id);
  const order = [...lotteryDraw(nonPlayoffWorstFirst), ...playoffWorstFirst];

  const maxVac = Math.max(0, ...Object.values(vacancies));
  const slots: {
    seasonId: string;
    round: number;
    pickNumber: number;
    teamId: string;
    originalOwnerTeamId: string;
  }[] = [];
  let pick = 1;
  for (let r = 0; r < maxVac; r++) {
    for (const teamId of order) {
      if ((vacancies[teamId] ?? 0) > r) {
        slots.push({
          seasonId: newSeason.id,
          round: r + 1,
          pickNumber: pick++,
          teamId,
          originalOwnerTeamId: teamId,
        });
      }
    }
  }
  if (slots.length > 0) await prisma.draftPick.createMany({ data: slots });

  // 6. Run CPU picks up to Washington (or finish + set lineups if WAS has no picks).
  await runCpuUntilUserOrDone(newSeason.id, newSeason.year);

  const open = await prisma.draftPick.count({
    where: { seasonId: newSeason.id, playerId: null },
  });
  if (open === 0) await autoAssignStartersForAll();

  return {
    newYear,
    retired: retiredIds.size,
    rookies: rookieData.length,
    fictional,
    vacancies: totalVac,
  };
}
