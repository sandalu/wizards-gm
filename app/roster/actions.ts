"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { WIZ } from "@/lib/data/nba";
import { setStarter } from "@/lib/rosterEngine";

/** Promote/demote a Washington player in the starting five. */
export async function toggleStarter(contractId: string, makeStarter: boolean) {
  // Guard: only Washington's lineup is user-editable.
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    select: { team: { select: { abbreviation: true } } },
  });
  if (!contract || contract.team.abbreviation !== WIZ) return;

  await setStarter(contractId, makeStarter);
  revalidatePath("/roster");
}
