// Draft engine — pure DB logic with NO Next.js request-context dependencies
// (no revalidatePath), so it can be exercised directly from a test script.
// The "use server" actions in app/draft/actions.ts wrap these and add revalidation.

import { prisma } from "@/lib/prisma";
import { BASE_SEASON, ROSTER_SIZE, WIZ } from "@/lib/data/nba";
import { buildSnakeOrder, shuffle, weightedPickFromTop } from "@/lib/draft";
import { randomContractYears, salaryFor } from "@/lib/cap";

export async function getOrCreateCurrentSeason() {
  let season = await prisma.season.findFirst({
    where: { isComplete: false },
    orderBy: { year: "desc" },
  });
  season ??= await prisma.season.findFirst({ orderBy: { year: "desc" } });
  season ??= await prisma.season.create({ data: { year: BASE_SEASON } });
  return season;
}

export async function getCurrentSeason() {
  return prisma.season.findFirst({ orderBy: { year: "desc" } });
}

/** The next unfilled draft slot (lowest pickNumber), with its team abbreviation. */
export async function nextOpenSlot(seasonId: string) {
  return prisma.draftPick.findFirst({
    where: { seasonId, playerId: null },
    orderBy: { pickNumber: "asc" },
    include: { team: { select: { abbreviation: true } } },
  });
}

export type PickTarget = { id: string; currentOverall: number; age: number };

/** Top-N undrafted, non-retired players by overall (the CPU's candidate pool). */
export async function topAvailable(n = 6): Promise<PickTarget[]> {
  return prisma.player.findMany({
    where: { contract: { is: null }, retiredAt: null },
    orderBy: { currentOverall: "desc" },
    take: n,
    select: { id: true, currentOverall: true, age: true },
  });
}

/** Assign a player to a slot and create their contract, atomically. */
export async function makePick(
  slotId: string,
  teamId: string,
  player: PickTarget,
  signedSeason: number,
) {
  const annualSalary = salaryFor(player.currentOverall, player.age);
  const yearsRemaining = randomContractYears();
  await prisma.$transaction([
    prisma.draftPick.update({
      where: { id: slotId },
      data: { playerId: player.id },
    }),
    prisma.contract.create({
      data: {
        playerId: player.id,
        teamId,
        yearsRemaining,
        annualSalary,
        signedSeason,
      },
    }),
  ]);
}

/** Create the full 15-round snake order as DraftPick slots (idempotent). */
export async function createDraftOrder(seasonId: string) {
  const existing = await prisma.draftPick.count({ where: { seasonId } });
  if (existing > 0) return existing;

  const teams = await prisma.team.findMany({ select: { id: true } });
  const teamCount = teams.length;
  const order = buildSnakeOrder(shuffle(teams.map((t) => t.id)), ROSTER_SIZE);

  await prisma.draftPick.createMany({
    data: order.map((teamId, i) => ({
      seasonId,
      round: Math.floor(i / teamCount) + 1,
      pickNumber: i + 1,
      teamId,
      originalOwnerTeamId: teamId,
    })),
  });
  return order.length;
}

/** Pick weighted-best-available for whatever slot is on the clock. Returns
 *  the abbreviation picked for, or null if the draft is done / pool empty.
 *  Used by both the CPU loop and the test harness. */
export async function pickCurrentSlot(seasonId: string, seasonYear: number) {
  const slot = await nextOpenSlot(seasonId);
  if (!slot) return null;
  const top = await topAvailable(6);
  if (top.length === 0) return null;
  const chosen = weightedPickFromTop(top, 6);
  await makePick(slot.id, slot.teamId, chosen, seasonYear);
  return slot.team.abbreviation;
}

/** Advance CPU picks until Washington is on the clock or the draft is complete. */
export async function runCpuUntilUserOrDone(
  seasonId: string,
  seasonYear: number,
) {
  for (let guard = 0; guard < 1000; guard++) {
    const slot = await nextOpenSlot(seasonId);
    if (!slot) return; // complete
    if (slot.team.abbreviation === WIZ) return; // user's turn
    const top = await topAvailable(6);
    if (top.length === 0) return;
    await makePick(slot.id, slot.teamId, weightedPickFromTop(top, 6), seasonYear);
  }
}
