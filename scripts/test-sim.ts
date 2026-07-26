// Integration test for the season simulation. Ensures a full draft exists,
// simulates the regular season, and asserts box-score / standings invariants.
//
// Run with:  npm run test:sim   (leaves the simulated season in the DB)
import { prisma } from "@/lib/prisma";
import { WIZ } from "@/lib/data/nba";
import {
  getOrCreateCurrentSeason,
  createDraftOrder,
  pickCurrentSlot,
} from "@/lib/draftEngine";
import { autoAssignStartersForAll } from "@/lib/rosterEngine";
import {
  simulateRegularSeason,
  isDraftComplete,
  standingsForSeason,
} from "@/lib/seasonEngine";

let failures = 0;
function check(label: string, cond: boolean, detail = "") {
  if (!cond) failures++;
  console.log(`  ${cond ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
}

async function main() {
  console.log("Season simulation integration test\n");
  const season = await getOrCreateCurrentSeason();

  // Ensure a complete draft (auto-draft everything if needed).
  if (!(await isDraftComplete(season.id))) {
    await prisma.contract.deleteMany();
    await prisma.draftPick.deleteMany({ where: { seasonId: season.id } });
    await createDraftOrder(season.id);
    while (await pickCurrentSlot(season.id, season.year)) {}
    await autoAssignStartersForAll();
  }

  const t0 = Date.now();
  const { games, boxLines } = await simulateRegularSeason(season.id);
  console.log(`  (simulated ${games} games, ${boxLines} box lines in ${Date.now() - t0}ms)\n`);

  const teamCount = await prisma.team.count();
  check("game count == teams*(teams-1)", games === teamCount * (teamCount - 1), `${games}`);

  // Pull everything once and aggregate in memory.
  const allGames = await prisma.game.findMany({
    where: { seasonId: season.id, isPlayoff: false },
    select: {
      id: true,
      homeTeamId: true,
      awayTeamId: true,
      homeScore: true,
      awayScore: true,
    },
  });
  const allLines = await prisma.boxScoreLine.findMany({
    where: { game: { seasonId: season.id, isPlayoff: false } },
    select: {
      gameId: true,
      teamId: true,
      points: true,
      rebounds: true,
      assists: true,
      steals: true,
      blocks: true,
      turnovers: true,
      minutes: true,
    },
  });

  // Aggregate points + minutes per (game, team).
  const pts = new Map<string, number>();
  const mins = new Map<string, number>();
  let negatives = 0;
  for (const l of allLines) {
    const key = `${l.gameId}:${l.teamId}`;
    pts.set(key, (pts.get(key) ?? 0) + l.points);
    mins.set(key, (mins.get(key) ?? 0) + l.minutes);
    if (
      l.points < 0 || l.rebounds < 0 || l.assists < 0 || l.steals < 0 ||
      l.blocks < 0 || l.turnovers < 0 || l.minutes < 0
    )
      negatives++;
  }

  let ptsMismatch = 0;
  let minsMismatch = 0;
  let ties = 0;
  for (const g of allGames) {
    if ((pts.get(`${g.id}:${g.homeTeamId}`) ?? -1) !== g.homeScore) ptsMismatch++;
    if ((pts.get(`${g.id}:${g.awayTeamId}`) ?? -1) !== g.awayScore) ptsMismatch++;
    if ((mins.get(`${g.id}:${g.homeTeamId}`) ?? -1) !== 240) minsMismatch++;
    if ((mins.get(`${g.id}:${g.awayTeamId}`) ?? -1) !== 240) minsMismatch++;
    if (g.homeScore === g.awayScore) ties++;
  }

  check("box points sum to team score (every game)", ptsMismatch === 0, `${ptsMismatch} mismatches`);
  check("minutes sum to 240 per team (every game)", minsMismatch === 0, `${minsMismatch} mismatches`);
  check("no negative stats", negatives === 0, `${negatives} negatives`);
  check("no tied games", ties === 0, `${ties} ties`);

  // Standings: every game yields exactly one win + one loss.
  const rec = await standingsForSeason(season.id);
  const totW = Object.values(rec).reduce((a, r) => a + r.wins, 0);
  const totL = Object.values(rec).reduce((a, r) => a + r.losses, 0);
  check("total wins == total losses == games", totW === games && totL === games, `${totW}/${totL}`);

  const wiz = await prisma.team.findFirst({ where: { abbreviation: WIZ } });
  const wizRec = rec[wiz!.id];
  check(
    "Washington played 2*(teams-1) games",
    wizRec.wins + wizRec.losses === 2 * (teamCount - 1),
    `${wizRec.wins}-${wizRec.losses}`,
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
