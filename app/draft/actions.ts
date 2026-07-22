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
  revalidateDraft();
}

/** Wipe the current draft (and the contracts it created) to start over. */
export async function resetDraft() {
  const season = await getCurrentSeason();
  if (!season) return;
  await prisma.contract.deleteMany();
  await prisma.draftPick.deleteMany({ where: { seasonId: season.id } });
  revalidateDraft();
}
