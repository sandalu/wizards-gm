// Trade engine — CPU evaluation (aggregate value + cap/roster validity),
// counter-offers, and applying accepted deals. DB layer, no request context.

import { prisma } from "@/lib/prisma";
import { WIZ, ROSTER_SIZE } from "@/lib/data/nba";
import { SALARY_CAP, LUXURY_TAX_LINE } from "@/lib/cap";
import {
  playerTradeValue,
  ACCEPT_TOLERANCE,
  COUNTER_FLOOR,
} from "@/lib/tradeValue";
import { autoAssignStartersForAll } from "@/lib/rosterEngine";

const MIN_ROSTER = 8;
const HARD_CEILING = LUXURY_TAX_LINE + 20_000_000;

export interface TradeAsset {
  contractId: string;
  playerId: string;
  name: string;
  position: string;
  overall: number;
  age: number;
  yearsRemaining: number;
  salary: number;
  isStarter: boolean;
}

export async function getTradeRoster(teamId: string): Promise<TradeAsset[]> {
  const rows = await prisma.contract.findMany({
    where: { teamId },
    include: { player: true },
    orderBy: { player: { currentOverall: "desc" } },
  });
  return rows.map((c) => ({
    contractId: c.id,
    playerId: c.playerId,
    name: c.player.name,
    position: c.player.position,
    overall: c.player.currentOverall,
    age: c.player.age,
    yearsRemaining: c.yearsRemaining,
    salary: c.annualSalary,
    isStarter: c.isStarter,
  }));
}

const val = (a: TradeAsset) =>
  playerTradeValue({ currentOverall: a.overall, age: a.age, yearsRemaining: a.yearsRemaining });
const sum = (as: TradeAsset[], pick: (a: TradeAsset) => number) =>
  as.reduce((s, a) => s + pick(a), 0);

export type TradeStatus = "accepted" | "rejected" | "countered" | "invalid";

export interface TradeDecision {
  status: TradeStatus;
  reason: string;
  valueWasSends: number; // value Washington gives up
  valueCpuSends: number; // value the CPU gives up
  counter?: { wasPlayerIds: string[]; cpuPlayerIds: string[] };
}

/** Cap/roster legality check for a proposed set of assets. */
function legal(
  wasRoster: TradeAsset[],
  cpuRoster: TradeAsset[],
  wasSend: TradeAsset[],
  cpuSend: TradeAsset[],
): { ok: boolean; reason: string } {
  const wasAfterCount = wasRoster.length - wasSend.length + cpuSend.length;
  const cpuAfterCount = cpuRoster.length - cpuSend.length + wasSend.length;
  if (wasAfterCount > ROSTER_SIZE || cpuAfterCount > ROSTER_SIZE)
    return { ok: false, reason: "a roster would exceed 15 players" };
  if (wasAfterCount < MIN_ROSTER || cpuAfterCount < MIN_ROSTER)
    return { ok: false, reason: "a roster would drop below 8 players" };

  const wasPay = sum(wasRoster, (a) => a.salary);
  const cpuPay = sum(cpuRoster, (a) => a.salary);
  const outWas = sum(wasSend, (a) => a.salary);
  const outCpu = sum(cpuSend, (a) => a.salary);
  const wasAfterPay = wasPay - outWas + outCpu;
  const cpuAfterPay = cpuPay - outCpu + outWas;

  if (wasAfterPay > HARD_CEILING || cpuAfterPay > HARD_CEILING)
    return { ok: false, reason: "a team would be pushed too far over the cap" };

  // Salary matching only bites when a team ends up over the cap.
  const match = (afterPay: number, incoming: number, outgoing: number) =>
    afterPay <= SALARY_CAP || incoming <= outgoing * 1.25 + 5_000_000;
  if (!match(wasAfterPay, outCpu, outWas) || !match(cpuAfterPay, outWas, outCpu))
    return { ok: false, reason: "salaries don't match closely enough for an over-cap team" };

  return { ok: true, reason: "" };
}

/** Evaluate a proposed trade from the CPU's perspective (no persistence). */
export function evaluateTrade(
  wasRoster: TradeAsset[],
  cpuRoster: TradeAsset[],
  wasPlayerIds: string[],
  cpuPlayerIds: string[],
): TradeDecision {
  const byId = new Map<string, TradeAsset>();
  [...wasRoster, ...cpuRoster].forEach((a) => byId.set(a.playerId, a));
  const wasSend = wasPlayerIds.map((id) => byId.get(id)!).filter(Boolean);
  const cpuSend = cpuPlayerIds.map((id) => byId.get(id)!).filter(Boolean);

  const valueWasSends = sum(wasSend, val); // CPU receives this
  const valueCpuSends = sum(cpuSend, val); // CPU gives this up
  const base = { valueWasSends, valueCpuSends };

  const lg = legal(wasRoster, cpuRoster, wasSend, cpuSend);
  if (!lg.ok) return { status: "rejected", reason: lg.reason, ...base };

  // CPU is happy if it receives at least (1 - tolerance) of what it gives up.
  if (valueWasSends >= valueCpuSends * (1 - ACCEPT_TOLERANCE)) {
    return { status: "accepted", reason: "fair value for both sides", ...base };
  }

  if (valueWasSends >= valueCpuSends * COUNTER_FLOOR) {
    // Counter by UPGRADING the offer: swap Washington's weakest offered player
    // for a better one it isn't already sending. This keeps roster sizes intact
    // (an "add a player" counter would push a full team past 15).
    const target = valueCpuSends * (1 - ACCEPT_TOLERANCE);
    const weakest = [...wasSend].sort((a, b) => val(a) - val(b))[0];
    const without = valueWasSends - val(weakest);
    const need = target - without; // value the replacement must supply
    const repl = wasRoster
      .filter((a) => !wasPlayerIds.includes(a.playerId) && val(a) >= need)
      .sort((a, b) => val(a) - val(b))[0]; // smallest sufficient upgrade
    if (repl) {
      const newIds = wasPlayerIds.filter((id) => id !== weakest.playerId).concat(repl.playerId);
      const newSend = newIds.map((id) => byId.get(id)!);
      if (legal(wasRoster, cpuRoster, newSend, cpuSend).ok) {
        return {
          status: "countered",
          reason: `CPU counters: send ${repl.name} instead of ${weakest.name}`,
          ...base,
          counter: { wasPlayerIds: newIds, cpuPlayerIds },
        };
      }
    }
    return { status: "rejected", reason: "CPU wants more value and no fair counter fits", ...base };
  }

  return { status: "rejected", reason: "too lopsided — the CPU gives up far more value", ...base };
}

/** Move contracts between the two teams and re-top-up starting fives. */
async function applyMoves(
  wasTeamId: string,
  otherTeamId: string,
  wasPlayerIds: string[],
  cpuPlayerIds: string[],
) {
  await prisma.$transaction([
    prisma.contract.updateMany({
      where: { playerId: { in: wasPlayerIds } },
      data: { teamId: otherTeamId, isStarter: false },
    }),
    prisma.contract.updateMany({
      where: { playerId: { in: cpuPlayerIds } },
      data: { teamId: wasTeamId, isStarter: false },
    }),
  ]);
  await autoAssignStartersForAll();
}

/** Propose a trade as Washington. Persists the outcome; applies if accepted. */
export async function proposeTrade(
  otherTeamId: string,
  wasPlayerIds: string[],
  cpuPlayerIds: string[],
): Promise<TradeDecision> {
  const zero = { valueWasSends: 0, valueCpuSends: 0 };
  if (wasPlayerIds.length === 0 || cpuPlayerIds.length === 0)
    return { status: "invalid", reason: "pick at least one player from each team", ...zero };

  const season = await prisma.season.findFirst({ orderBy: { year: "desc" } });
  const wasTeam = await prisma.team.findFirst({ where: { abbreviation: WIZ } });
  const otherTeam = await prisma.team.findUnique({ where: { id: otherTeamId } });
  if (!season || !wasTeam || !otherTeam || otherTeam.abbreviation === WIZ)
    return { status: "invalid", reason: "invalid teams", ...zero };

  const [wasRoster, cpuRoster] = await Promise.all([
    getTradeRoster(wasTeam.id),
    getTradeRoster(otherTeamId),
  ]);

  // Ownership validation.
  const wasOwned = new Set(wasRoster.map((a) => a.playerId));
  const cpuOwned = new Set(cpuRoster.map((a) => a.playerId));
  if (!wasPlayerIds.every((id) => wasOwned.has(id)) || !cpuPlayerIds.every((id) => cpuOwned.has(id)))
    return { status: "invalid", reason: "players must belong to the right teams", ...zero };

  const decision = evaluateTrade(wasRoster, cpuRoster, wasPlayerIds, cpuPlayerIds);

  // Persist the proposal + outcome.
  await prisma.trade.create({
    data: {
      seasonId: season.id,
      initiatingTeamId: wasTeam.id,
      otherTeamId,
      status: decision.status,
      assets: JSON.stringify({
        fromInitiating: { playerIds: wasPlayerIds },
        fromOther: { playerIds: cpuPlayerIds },
      }),
    },
  });

  if (decision.status === "accepted") {
    await applyMoves(wasTeam.id, otherTeamId, wasPlayerIds, cpuPlayerIds);
  }

  return decision;
}
