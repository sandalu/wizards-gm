// Integration test for the draft engine — runs a FULL draft against the real
// (local) SQLite DB, asserts the invariants, then resets so the app starts fresh.
//
// Run with:  npx tsx scripts/test-draft.ts   (requires `npm run db:seed` first)
import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { TOTAL_PLAYERS, ROSTER_SIZE } from "@/lib/data/nba";
import { MIN_SALARY, MAX_SALARY } from "@/lib/cap";
import {
  getOrCreateCurrentSeason,
  createDraftOrder,
  pickCurrentSlot,
} from "@/lib/draftEngine";

let failures = 0;
function check(label: string, cond: boolean, detail = "") {
  const ok = cond ? "✓" : "✗";
  if (!cond) failures++;
  console.log(`  ${ok} ${label}${detail ? ` — ${detail}` : ""}`);
}

async function main() {
  console.log("Draft engine integration test\n");

  const players = await prisma.player.count();
  if (players < TOTAL_PLAYERS) {
    throw new Error(
      `Need ${TOTAL_PLAYERS} players seeded (found ${players}). Run npm run db:seed.`,
    );
  }

  // Clean slate.
  const season = await getOrCreateCurrentSeason();
  await prisma.contract.deleteMany();
  await prisma.draftPick.deleteMany({ where: { seasonId: season.id } });

  // Build order + run a full CPU draft (WAS auto-picked too, for the test).
  const slots = await createDraftOrder(season.id);
  check("snake order has 30×15 slots", slots === TOTAL_PLAYERS, `${slots}`);

  let picks = 0;
  while (await pickCurrentSlot(season.id, season.year)) picks++;

  // --- Invariants --------------------------------------------------------
  const filled = await prisma.draftPick.count({
    where: { seasonId: season.id, playerId: { not: null } },
  });
  const open = await prisma.draftPick.count({
    where: { seasonId: season.id, playerId: null },
  });
  const contracts = await prisma.contract.count();

  check("every slot filled", filled === TOTAL_PLAYERS, `${filled}/${TOTAL_PLAYERS}`);
  check("no open slots left", open === 0, `${open} open`);
  check("one contract per pick", contracts === TOTAL_PLAYERS, `${contracts}`);
  check("picks made == pool", picks === TOTAL_PLAYERS, `${picks}`);

  // Every team has exactly 15.
  const teams = await prisma.team.findMany({ select: { id: true, abbreviation: true } });
  let allFull = true;
  for (const t of teams) {
    const n = await prisma.contract.count({ where: { teamId: t.id } });
    if (n !== ROSTER_SIZE) {
      allFull = false;
      console.log(`      ${t.abbreviation}: ${n}`);
    }
  }
  check("all 30 teams have 15 players", allFull);

  // No duplicate players drafted.
  const distinctPlayers = await prisma.contract.findMany({
    select: { playerId: true },
    distinct: ["playerId"],
  });
  check(
    "no player drafted twice",
    distinctPlayers.length === TOTAL_PLAYERS,
    `${distinctPlayers.length} distinct`,
  );

  // Salary + contract-length sanity.
  const agg = await prisma.contract.aggregate({
    _min: { annualSalary: true, yearsRemaining: true },
    _max: { annualSalary: true, yearsRemaining: true },
  });
  check(
    "salaries within [MIN, MAX]",
    (agg._min.annualSalary ?? 0) >= MIN_SALARY &&
      (agg._max.annualSalary ?? 0) <= MAX_SALARY,
    `${agg._min.annualSalary}–${agg._max.annualSalary}`,
  );
  check(
    "contract length 1–4 years",
    (agg._min.yearsRemaining ?? 0) >= 1 && (agg._max.yearsRemaining ?? 0) <= 4,
    `${agg._min.yearsRemaining}–${agg._max.yearsRemaining}`,
  );

  // Reset so the app opens on a fresh "Start Draft" screen for the user.
  await prisma.contract.deleteMany();
  await prisma.draftPick.deleteMany({ where: { seasonId: season.id } });
  console.log("\n  (draft reset — app will start fresh)");

  console.log(failures === 0 ? "\nALL CHECKS PASSED ✅" : `\n${failures} CHECK(S) FAILED ❌`);
  if (failures > 0) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
