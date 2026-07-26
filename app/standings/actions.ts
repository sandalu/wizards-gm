"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isDraftComplete, simulateRegularSeason } from "@/lib/seasonEngine";

/** Simulate (or re-simulate) the current season's regular schedule. */
export async function simulateSeason() {
  const season = await prisma.season.findFirst({ orderBy: { year: "desc" } });
  if (!season) return;
  if (!(await isDraftComplete(season.id))) return; // rosters not set yet

  await simulateRegularSeason(season.id);
  revalidatePath("/standings");
  revalidatePath("/");
}
