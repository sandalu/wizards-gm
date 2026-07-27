// Integration test for the playoff engine. Ensures a simulated regular season
// exists, runs the postseason, and asserts bracket / champion / Finals-MVP
// invariants. Run with:  npm run test:playoffs
import { prisma } from "@/lib/prisma";
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
} from "@/lib/seasonEngine";
import { runPlayoffs, type BracketJSON, type SeriesJSON } from "@/lib/playoffEngine";

let failures = 0;
function check(label: string, cond: boolean, detail = "") {
  if (!cond) failures++;
  console.log(`  ${cond ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
}

function seriesValid(s: SeriesJSON): boolean {
  const winnerWins = s.winnerId === s.higherId ? s.winsHigher : s.winsLower;
  const loserWins = s.winnerId === s.higherId ? s.winsLower : s.winsHigher;
  const games = s.winsHigher + s.winsLower;
  return winnerWins === 4 && loserWins < 4 && games >= 4 && games <= 7;
}

async function main() {
  console.log("Playoff engine integration test\n");
  const season = await getOrCreateCurrentSeason();

  if (!(await isDraftComplete(season.id))) {
    await prisma.contract.deleteMany();
    await prisma.draftPick.deleteMany({ where: { seasonId: season.id } });
    await createDraftOrder(season.id);
    while (await pickCurrentSlot(season.id, season.year)) {}
    await autoAssignStartersForAll();
  }
  if (!(await hasGames(season.id))) await simulateRegularSeason(season.id);

  const t0 = Date.now();
  const { championId, finalsMvpId, playoffGames } = await runPlayoffs(season.id);
  console.log(`  (ran playoffs: ${playoffGames} games in ${Date.now() - t0}ms)\n`);

  const fresh = await prisma.season.findUnique({ where: { id: season.id } });
  const bracket: BracketJSON = JSON.parse(fresh!.bracket!);

  const teams = await prisma.team.findMany({
    select: { id: true, conference: true },
  });
  const confOf = new Map(teams.map((t) => [t.id, t.conference]));

  // Every series is a valid best-of-7.
  const allSeries = [
    ...bracket.east.round1,
    ...bracket.east.round2,
    bracket.east.confFinal,
    ...bracket.west.round1,
    ...bracket.west.round2,
    bracket.west.confFinal,
    bracket.finals,
  ];
  check(
    "all 15 series are valid best-of-7",
    allSeries.length === 15 && allSeries.every(seriesValid),
    `${allSeries.length} series`,
  );

  // Conference champions come from the right conference.
  check("East champ is an East team", confOf.get(bracket.east.champId) === "E");
  check("West champ is a West team", confOf.get(bracket.west.champId) === "W");

  // Finals is East champ vs West champ; winner is the league champion.
  const finalists = [bracket.finals.higherId, bracket.finals.lowerId];
  check(
    "Finals is the two conference champs",
    finalists.includes(bracket.east.champId) &&
      finalists.includes(bracket.west.champId),
  );
  check("champion == Finals winner", championId === bracket.finals.winnerId);
  check("season.championTeamId persisted", fresh!.championTeamId === championId);
  check("season marked complete", fresh!.isComplete === true);

  // Finals MVP is on the champion's roster.
  const mvpOnChamp = finalsMvpId
    ? await prisma.contract.findFirst({
        where: { teamId: championId, playerId: finalsMvpId },
      })
    : null;
  check("Finals MVP is a champion player", !!mvpOnChamp, finalsMvpId ?? "null");

  // Playoff games: all flagged, box points reconcile (spot check a sample).
  const pGames = await prisma.game.findMany({
    where: { seasonId: season.id, isPlayoff: true },
    select: { id: true, homeTeamId: true, homeScore: true, awayScore: true, awayTeamId: true },
  });
  check("playoff games flagged isPlayoff", pGames.length === playoffGames, `${pGames.length}`);

  let mismatch = 0;
  for (const g of pGames.slice(0, 20)) {
    const homePts = await prisma.boxScoreLine.aggregate({
      where: { gameId: g.id, teamId: g.homeTeamId },
      _sum: { points: true },
    });
    const awayPts = await prisma.boxScoreLine.aggregate({
      where: { gameId: g.id, teamId: g.awayTeamId },
      _sum: { points: true },
    });
    if (homePts._sum.points !== g.homeScore || awayPts._sum.points !== g.awayScore)
      mismatch++;
  }
  check("playoff box points reconcile (sample 20)", mismatch === 0, `${mismatch}`);

  console.log(failures === 0 ? "\nALL CHECKS PASSED ✅" : `\n${failures} CHECK(S) FAILED ❌`);
  if (failures > 0) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
