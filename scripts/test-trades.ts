// Integration test for the trade engine. Synthetic rosters exercise the CPU
// decision logic (accept / reject / counter / legality); a real DB proposal
// verifies contracts actually move and the trade persists.
// Run with:  npm run test:trades
import { prisma } from "@/lib/prisma";
import { WIZ } from "@/lib/data/nba";
import {
  getOrCreateCurrentSeason,
  createDraftOrder,
  pickCurrentSlot,
} from "@/lib/draftEngine";
import { autoAssignStartersForAll } from "@/lib/rosterEngine";
import { isDraftComplete } from "@/lib/seasonEngine";
import {
  evaluateTrade,
  proposeTrade,
  getTradeRoster,
  type TradeAsset,
} from "@/lib/tradeEngine";
import { playerTradeValue } from "@/lib/tradeValue";

let failures = 0;
function check(label: string, cond: boolean, detail = "") {
  if (!cond) failures++;
  console.log(`  ${cond ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
}

function asset(id: string, overall: number, age = 27, years = 2): TradeAsset {
  return {
    contractId: "k" + id,
    playerId: id,
    name: id,
    position: "SF",
    overall,
    age,
    yearsRemaining: years,
    salary: 3_000_000, // low → under cap, so salary-matching never bites here
    isStarter: false,
  };
}

function syntheticTests() {
  console.log("Synthetic decision-logic tests:");
  // WAS: w0=90 star, w1=80, w2=70, rest 75. CPU: c0=90, c1=88, c2=70, rest 75.
  const was: TradeAsset[] = [
    asset("w0", 90), asset("w1", 80), asset("w2", 70),
    ...Array.from({ length: 12 }, (_, i) => asset("wb" + i, 75)),
  ];
  const cpu: TradeAsset[] = [
    asset("c0", 90), asset("c1", 88), asset("c2", 70),
    ...Array.from({ length: 12 }, (_, i) => asset("cb" + i, 75)),
  ];

  check("equal swap accepted", evaluateTrade(was, cpu, ["w0"], ["c0"]).status === "accepted");
  check(
    "lopsided (scrub for star) rejected",
    evaluateTrade(was, cpu, ["w2"], ["c1"]).status === "rejected",
  );
  check(
    "overpay (star for scrub) accepted",
    evaluateTrade(was, cpu, ["w0"], ["c2"]).status === "accepted",
  );

  const counter = evaluateTrade(was, cpu, ["w1"], ["c1"]);
  check("slight-underpay countered", counter.status === "countered", counter.status);
  check(
    "counter upgrades the offer (same size, better player)",
    !!counter.counter &&
      counter.counter.wasPlayerIds.length === 1 &&
      counter.counter.wasPlayerIds[0] !== "w1",
  );
  if (counter.counter) {
    const after = evaluateTrade(was, cpu, counter.counter.wasPlayerIds, counter.counter.cpuPlayerIds);
    check("accepting the counter is accepted", after.status === "accepted", after.status);
  }

  // Legality: shipping out 9 players leaves < 8 → rejected.
  const nine = was.slice(0, 9).map((a) => a.playerId);
  check(
    "roster-gutting trade rejected",
    evaluateTrade(was, cpu, nine, ["c0"]).status === "rejected",
  );

  // Value monotonic sanity.
  check(
    "higher overall = higher value",
    playerTradeValue({ currentOverall: 90, age: 27, yearsRemaining: 2 }) >
      playerTradeValue({ currentOverall: 75, age: 27, yearsRemaining: 2 }),
  );
}

async function dbTests() {
  console.log("\nDB application tests:");
  const season = await getOrCreateCurrentSeason();
  if (!(await isDraftComplete(season.id))) {
    await prisma.contract.deleteMany();
    await prisma.draftPick.deleteMany({ where: { seasonId: season.id } });
    await createDraftOrder(season.id);
    while (await pickCurrentSlot(season.id, season.year)) {}
    await autoAssignStartersForAll();
  }

  const wasTeam = await prisma.team.findFirst({ where: { abbreviation: WIZ } });
  const cpuTeam = await prisma.team.findFirst({
    where: { abbreviation: { not: WIZ } },
    orderBy: { name: "asc" },
  });

  // Empty side is invalid.
  const inv = await proposeTrade(cpuTeam!.id, [], ["x"]);
  check("empty-side proposal is invalid", inv.status === "invalid");

  const wasR = await getTradeRoster(wasTeam!.id);
  const cpuR = await getTradeRoster(cpuTeam!.id);

  // Try the closest-overall pairs (similar value + salary) until one is accepted.
  const pairs: { w: string; c: string; diff: number }[] = [];
  for (const w of wasR)
    for (const c of cpuR) pairs.push({ w: w.playerId, c: c.playerId, diff: Math.abs(w.overall - c.overall) });
  pairs.sort((a, b) => a.diff - b.diff);

  let accepted: { w: string; c: string } | null = null;
  for (const p of pairs.slice(0, 15)) {
    const d = await proposeTrade(cpuTeam!.id, [p.w], [p.c]);
    if (d.status === "accepted") {
      accepted = { w: p.w, c: p.c };
      break;
    }
  }
  check("a fair 1-for-1 was accepted", !!accepted);

  if (accepted) {
    const wPlayer = await prisma.contract.findUnique({ where: { playerId: accepted.w } });
    const cPlayer = await prisma.contract.findUnique({ where: { playerId: accepted.c } });
    check("Washington's player moved to the CPU team", wPlayer?.teamId === cpuTeam!.id);
    check("CPU's player moved to Washington", cPlayer?.teamId === wasTeam!.id);

    const wasCount = await prisma.contract.count({ where: { teamId: wasTeam!.id } });
    const cpuCount = await prisma.contract.count({ where: { teamId: cpuTeam!.id } });
    check("both rosters still 15 (1-for-1)", wasCount === 15 && cpuCount === 15, `${wasCount}/${cpuCount}`);

    const persisted = await prisma.trade.count({ where: { status: "accepted" } });
    check("accepted trade persisted", persisted >= 1);
  }
}

async function main() {
  console.log("Trade engine integration test\n");
  syntheticTests();
  await dbTests();
  console.log(failures === 0 ? "\nALL CHECKS PASSED ✅" : `\n${failures} CHECK(S) FAILED ❌`);
  if (failures > 0) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
