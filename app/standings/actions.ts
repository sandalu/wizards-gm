"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isDraftComplete, simulateRegularSeason, hasGames } from "@/lib/seasonEngine";
import { runPlayoffs } from "@/lib/playoffEngine";

/** Simulate (or re-simulate) the current season's regular schedule. Clears any
 *  playoffs/champion, since the bracket depends on the regular-season results. */
export async function simulateSeason() {
  const season = await prisma.season.findFirst({ orderBy: { year: "desc" } });
  if (!season) return;
  if (!(await isDraftComplete(season.id))) return; // rosters not set yet

  await simulateRegularSeason(season.id);
  await prisma.season.update({
    where: { id: season.id },
    data: {
      championTeamId: null,
      finalsMvpId: null,
      bracket: null,
      isComplete: false,
    },
  });
  revalidatePath("/standings");
  revalidatePath("/history");
  revalidatePath("/");
}

/** Run the postseason from the current regular-season standings. */
export async function runPostseason() {
  const season = await prisma.season.findFirst({ orderBy: { year: "desc" } });
  if (!season) return;
  if (!(await hasGames(season.id))) return; // no regular season yet

  await runPlayoffs(season.id);
  revalidatePath("/standings");
  revalidatePath("/history");
  revalidatePath("/");
}
