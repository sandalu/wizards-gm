// Integration test for the offseason engine. Sets up a full season, advances the
// offseason, and asserts aging / retirement / contract / rookie-class / lottery
// invariants — then advances a SECOND time to prove the multi-year loop.
// Run with:  npm run test:offseason
import { prisma } from "@/lib/prisma";
import { WIZ, ROSTER_SIZE } from "@/lib/data/nba";
import {
  getOrCreateCurrentSeason,
  createDraftOrder,
  pickCurrentSlot,
} from "@/lib/draftEngine";
import { autoAssignStartersForAll } from "@/lib/rosterEngine";
import {
  isDraftComplete,
  hasGames,
  simulateRegularSeason,
  standingsForSeason,
} from "@/lib/seasonEngine";
import { runPlayoffs } from "@/lib/playoffEngine";
import { advanceOffseason, ROOKIE_CLASS_SIZE } from "@/lib/offseasonEngine";

let failures = 0;
function check(label: string, cond: boolean, detail = "") {
  if (!cond) failures++;
  console.log(`  ${cond ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
}

async function playFullSeason(seasonId: string, year: number) {
  if (!(await isDraftComplete(seasonId))) {
    while (await pickCurrentSlot(seasonId, year)) {}
    await autoAssignStartersForAll();
  }
  if (!(await hasGames(seasonId))) await simulateRegularSeason(seasonId);
  const s = await prisma.season.findUnique({ where: { id: seasonId } });
  if (!s?.championTeamId) await runPlayoffs(seasonId);
}

async function main() {
  console.log("Offseason engine integration test\n");

  // Fresh season 1.
  const season1 = await getOrCreateCurrentSeason();
  await prisma.contract.deleteMany();
  await prisma.draftPick.deleteMany({ where: { seasonId: season1.id } });
  await createDraftOrder(season1.id);
  await playFullSeason(season1.id, season1.year);

  // Snapshot pre-offseason ages + roster counts.
  const before = await prisma.player.findMany({
    where: { retiredAt: null },
    select: { id: true, age: true },
  });
  const ageBefore = new Map(before.map((p) => [p.id, p.age]));
  const contractsBefore = await prisma.contract.count();

  // Playoff set from season 1 (to check the lottery favours non-playoff teams).
  const standings = await standingsForSeason(season1.id);
  const teams = await prisma.team.findMany({ select: { id: true, conference: true } });
  const pct = (id: string) => {
    const r = standings[id];
    return r && r.wins + r.losses > 0 ? r.wins / (r.wins + r.losses) : 0;
  };
  const playoffSet = new Set<string>();
  for (const conf of ["E", "W"])
    teams
      .filter((t) => t.conference === conf)
      .sort((a, b) => pct(b.id) - pct(a.id))
      .slice(0, 8)
      .forEach((t) => playoffSet.add(t.id));

  // --- Advance offseason ---
  const sum = await advanceOffseason(season1.id);
  console.log(`  (retired ${sum!.retired}, rookies ${sum!.rookies} [${sum!.fictional} fictional], vacancies ${sum!.vacancies})\n`);

  const season2 = await prisma.season.findFirst({ orderBy: { year: "desc" } });
  check("new season is year+1", season2!.year === season1.year + 1, `${season2!.year}`);

  // Aging: every previously-active, still-present player aged exactly +1.
  const after = await prisma.player.findMany({
    where: { id: { in: [...ageBefore.keys()] } },
    select: { id: true, age: true },
  });
  const agedWrong = after.filter((p) => p.age !== (ageBefore.get(p.id) ?? -99) + 1).length;
  check("all prior players aged +1", agedWrong === 0, `${agedWrong} wrong`);

  // Overalls stay in range.
  const ovrAgg = await prisma.player.aggregate({
    where: { retiredAt: null },
    _min: { currentOverall: true },
    _max: { currentOverall: true },
  });
  check(
    "overalls within [40,99]",
    (ovrAgg._min.currentOverall ?? 40) >= 40 && (ovrAgg._max.currentOverall ?? 99) <= 99,
    `${ovrAgg._min.currentOverall}-${ovrAgg._max.currentOverall}`,
  );

  // Contracts: none expired-to-zero remain, retirees hold no contract.
  const badYears = await prisma.contract.count({ where: { yearsRemaining: { lte: 0 } } });
  check("no contract at 0 years", badYears === 0);
  const retiredWithContract = await prisma.contract.count({
    where: { player: { retiredAt: { not: null } } },
  });
  check("retired players have no contract", retiredWithContract === 0);
  check("contract count did not grow", (await prisma.contract.count()) <= contractsBefore);

  // Rookie class: real reserve names, age 19, careerStage rookie.
  const rookies = await prisma.player.findMany({
    where: { careerStage: "rookie", age: 19, birthYear: season2!.year - 19 },
    select: { isReal: true },
  });
  check("rookie class added (>= base size)", rookies.length >= ROOKIE_CLASS_SIZE, `${rookies.length}`);
  check(
    "rookies are real (reserve not exhausted)",
    rookies.every((r) => r.isReal),
    `${rookies.filter((r) => !r.isReal).length} fictional`,
  );

  // Draft slots == vacancies; lottery gives pick #1 to a non-playoff team.
  const slotCount = await prisma.draftPick.count({ where: { seasonId: season2!.id } });
  check("draft slots == vacancies", slotCount === sum!.vacancies, `${slotCount}`);
  const pick1 = await prisma.draftPick.findFirst({
    where: { seasonId: season2!.id },
    orderBy: { pickNumber: "asc" },
  });
  check(
    "pick #1 is a non-playoff team (lottery)",
    !!pick1 && !playoffSet.has(pick1.teamId),
  );

  // Supply must cover demand — every open slot must be fillable.
  const openSlots = await prisma.draftPick.count({
    where: { seasonId: season2!.id, playerId: null },
  });
  const available = await prisma.player.count({
    where: { contract: { is: null }, retiredAt: null },
  });
  check("enough real players to fill the draft", available >= openSlots, `${available} avail / ${openSlots} open`);

  // No team exceeds the roster cap at any point.
  const counts = await prisma.contract.groupBy({ by: ["teamId"], _count: { _all: true } });
  check("no roster over 15", counts.every((c) => c._count._all <= ROSTER_SIZE));

  // --- Second offseason (multi-year loop) ---
  await playFullSeason(season2!.id, season2!.year);
  const sum2 = await advanceOffseason(season2!.id);
  const season3 = await prisma.season.findFirst({ orderBy: { year: "desc" } });
  check("second advance → year+2", season3!.year === season1.year + 2, `${season3!.year}`);
  check("second rookie class added", sum2!.rookies >= ROOKIE_CLASS_SIZE);

  console.log(failures === 0 ? "\nALL CHECKS PASSED ✅" : `\n${failures} CHECK(S) FAILED ❌`);
  if (failures > 0) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
