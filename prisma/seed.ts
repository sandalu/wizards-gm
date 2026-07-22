// Phase 1 seed — loads the 30 real NBA teams and the ~450 real curated players
// into the database. Idempotent: wipes existing rows first, so re-running is safe.
//
// Run with:  npm run db:seed
import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { TEAMS, WIZ, derivedPool, TOTAL_PLAYERS } from "../lib/data/nba";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding Wizards GM database…");

  // Wipe in dependency order so re-seeding is clean and order-independent.
  await prisma.award.deleteMany();
  await prisma.boxScoreLine.deleteMany();
  await prisma.game.deleteMany();
  await prisma.draftPick.deleteMany();
  await prisma.trade.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.player.deleteMany();
  await prisma.season.deleteMany();
  await prisma.team.deleteMany();

  // --- Teams -------------------------------------------------------------
  await prisma.team.createMany({
    data: TEAMS.map((t) => ({
      name: t.name,
      abbreviation: t.id,
      conference: t.conf,
      primaryColor: t.color,
      isUserControlled: t.id === WIZ,
    })),
  });
  const teamCount = await prisma.team.count();

  // --- Players -----------------------------------------------------------
  const pool = derivedPool();
  await prisma.player.createMany({
    data: pool.map((p) => ({
      name: p.name,
      position: p.position,
      birthYear: p.birthYear,
      age: p.age,
      careerStage: p.careerStage,
      baseOverall: p.baseOverall,
      currentOverall: p.currentOverall,
      potential: p.potential,
      isReal: true,
      retiredAt: null,
    })),
  });
  const playerCount = await prisma.player.count();

  // --- Report ------------------------------------------------------------
  const byStage = pool.reduce<Record<string, number>>((acc, p) => {
    acc[p.careerStage] = (acc[p.careerStage] ?? 0) + 1;
    return acc;
  }, {});

  console.log(`  Teams seeded:   ${teamCount} (expected 30)`);
  console.log(
    `  Players seeded: ${playerCount} (pool ${pool.length} / target ${TOTAL_PLAYERS})`,
  );
  console.log(`  Career stages:  ${JSON.stringify(byStage)}`);

  if (teamCount !== 30) throw new Error(`Expected 30 teams, got ${teamCount}`);
  if (playerCount < TOTAL_PLAYERS) {
    console.warn(
      `  ⚠ Pool has fewer than ${TOTAL_PLAYERS} players — the draft needs exactly ` +
        `${TOTAL_PLAYERS} to fill every roster. Add more real players to CURATED_2.`,
    );
  }
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
