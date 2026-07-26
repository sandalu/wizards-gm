"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { WIZ } from "@/lib/data/nba";
import {
  createDraftOrder,
  getCurrentSeason,
  getOrCreateCurrentSeason,
  makePick,
  nextOpenSlot,
  runCpuUntilUserOrDone,
} from "@/lib/draftEngine";
import { autoAssignStartersForAll } from "@/lib/rosterEngine";

/** When the draft has no open slots left, give every team a default lineup. */
async function assignStartersIfComplete(seasonId: string) {
  const open = await prisma.draftPick.count({
    where: { seasonId, playerId: null },
  });
  if (open === 0) await autoAssignStartersForAll();
}

function revalidateDraft() {
  revalidatePath("/draft");
  revalidatePath("/");
  revalidatePath("/roster");
}

/** Begin the initial draft: build the snake order, then run CPU up to Washington. */
export async function startDraft() {
  const season = await getOrCreateCurrentSeason();
  await createDraftOrder(season.id);
  await runCpuUntilUserOrDone(season.id, season.year);
  await assignStartersIfComplete(season.id);
  revalidateDraft();
}

/** Make Washington's pick (only valid when WAS is on the clock), then advance. */
export async function userDraft(playerId: string) {
  const season = await getCurrentSeason();
  if (!season) return;

  const slot = await nextOpenSlot(season.id);
  if (!slot || slot.team.abbreviation !== WIZ) return; // not the user's turn

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: {
      id: true,
      currentOverall: true,
      age: true,
      retiredAt: true,
      contract: { select: { id: true } },
    },
  });
  if (!player || player.contract || player.retiredAt) return; // already taken

  await makePick(slot.id, slot.teamId, player, season.year);
  await runCpuUntilUserOrDone(season.id, season.year);
  await assignStartersIfComplete(season.id);
  revalidateDraft();
}

/** Wipe the current draft — contracts, picks, and any simulated games — to
 *  start the franchise over from an empty league. */
export async function resetDraft() {
  const season = await getCurrentSeason();
  if (!season) return;
  await prisma.boxScoreLine.deleteMany({ where: { game: { seasonId: season.id } } });
  await prisma.game.deleteMany({ where: { seasonId: season.id } });
  await prisma.contract.deleteMany();
  await prisma.draftPick.deleteMany({ where: { seasonId: season.id } });
  revalidateDraft();
  revalidatePath("/standings");
}
