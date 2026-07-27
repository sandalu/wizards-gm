// Integration test for the awards engine. Ensures a full season + playoffs,
// computes awards, and asserts each category. Run with:  npm run test:awards
import { prisma } from "@/lib/prisma";
import { WIZ } from "@/lib/data/nba";
import {
  getOrCreateCurrentSeason,
  createDraftOrder,
  pickCurrentSlot,
} from "@/lib/draftEngine";
import { autoAssignStartersForAll } from "@/lib/rosterEngine";
import { isDraftComplete, hasGames, simulateRegularSeason } from "@/lib/seasonEngine";
import { runPlayoffs } from "@/lib/playoffEngine";
import { computeSeasonAwards } from "@/lib/awardsEngine";

let failures = 0;
function check(label: string, cond: boolean, detail = "") {
  if (!cond) failures++;
  console.log(`  ${cond ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
}

async function main() {
  console.log("Awards engine integration test\n");
  const season = await getOrCreateCurrentSeason();

  if (!(await isDraftComplete(season.id))) {
    await prisma.contract.deleteMany();
    await prisma.draftPick.deleteMany({ where: { seasonId: season.id } });
    await createDraftOrder(season.id);
    while (await pickCurrentSlot(season.id, season.year)) {}
    await autoAssignStartersForAll();
  }
  if (!(await hasGames(season.id))) await simulateRegularSeason(season.id);
  const fresh0 = await prisma.season.findUnique({ where: { id: season.id } });
  if (!fresh0?.championTeamId) await runPlayoffs(season.id);

  await computeSeasonAwards(season.id);

  const awards = await prisma.award.findMany({
    where: { seasonId: season.id },
    include: {
      player: { select: { careerStage: true } },
      team: { select: { abbreviation: true } },
    },
  });
  const byType = (t: string) => awards.filter((a) => a.type === t);
  const solo = (t: string) => byType(t)[0];

  const season2 = await prisma.season.findUnique({ where: { id: season.id } });

  // Player→team + starter/careerStage lookups for cross-checks.
  const players = await prisma.player.findMany({
    where: { contract: { isNot: null } },
    select: { id: true, careerStage: true, contract: { select: { isStarter: true } } },
  });
  const pmeta = new Map(players.map((p) => [p.id, p]));

  check("MVP awarded", !!solo("MVP") && !!solo("MVP").playerId);
  check("DPOY awarded", !!solo("DPOY") && !!solo("DPOY").playerId);

  const roy = solo("ROY");
  check(
    "ROY is a rookie",
    !!roy && roy.player?.careerStage === "rookie",
    roy?.player?.careerStage,
  );

  const smoy = solo("6MOY");
  check(
    "6MOY is a bench player",
    !!smoy && pmeta.get(smoy.playerId!)?.contract?.isStarter === false,
  );

  const coy = solo("COY");
  check(
    "COY is a CPU team with no player",
    !!coy && coy.playerId === null && coy.team.abbreviation !== WIZ,
    coy?.team.abbreviation,
  );

  check("All-NBA 1st has 5", byType("AllNBA1st").length === 5);
  check("All-NBA 2nd has 5", byType("AllNBA2nd").length === 5);
  check("All-NBA 3rd has 5", byType("AllNBA3rd").length === 5);
  check("All-Defensive 1st has 5", byType("AllDefense1st").length === 5);

  // MVP should be on All-NBA 1st team (top by mvp score).
  const firstTeamIds = new Set(byType("AllNBA1st").map((a) => a.playerId));
  check("MVP is on All-NBA 1st team", firstTeamIds.has(solo("MVP")?.playerId ?? ""));

  // All 15 All-NBA selections are distinct players.
  const allNba = [...byType("AllNBA1st"), ...byType("AllNBA2nd"), ...byType("AllNBA3rd")];
  check(
    "15 distinct All-NBA players",
    new Set(allNba.map((a) => a.playerId)).size === 15,
  );

  const fmvp = solo("FinalsMVP");
  check(
    "Finals MVP matches season.finalsMvpId",
    !!fmvp && fmvp.playerId === season2?.finalsMvpId,
  );

  console.log(failures === 0 ? "\nALL CHECKS PASSED ✅" : `\n${failures} CHECK(S) FAILED ❌`);
  if (failures > 0) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
