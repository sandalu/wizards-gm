// Roster / cap DB logic — pure of Next request context (no revalidatePath).

import { prisma } from "@/lib/prisma";
import { STARTERS } from "@/lib/cap";

/**
 * Ensure every team has up to STARTERS starters. Promotes the best non-starters
 * by overall until the team has 5 (or runs out of players). Idempotent — used
 * after the initial draft and after each offseason (when retirements/expirations
 * can leave a team short of a full starting five).
 */
export async function autoAssignStartersForAll() {
  const teams = await prisma.team.findMany({ select: { id: true } });
  for (const t of teams) {
    const starterCount = await prisma.contract.count({
      where: { teamId: t.id, isStarter: true },
    });
    const need = STARTERS - starterCount;
    if (need <= 0) continue;

    const promote = await prisma.contract.findMany({
      where: { teamId: t.id, isStarter: false },
      orderBy: { player: { currentOverall: "desc" } },
      take: need,
      select: { id: true },
    });
    if (promote.length === 0) continue;

    await prisma.contract.updateMany({
      where: { id: { in: promote.map((c) => c.id) } },
      data: { isStarter: true },
    });
  }
}

/** Total payroll per team id (only teams that have contracts appear). */
export async function payrollByTeam(): Promise<Record<string, number>> {
  const grouped = await prisma.contract.groupBy({
    by: ["teamId"],
    _sum: { annualSalary: true },
  });
  const out: Record<string, number> = {};
  for (const g of grouped) out[g.teamId] = g._sum.annualSalary ?? 0;
  return out;
}

/**
 * Promote/demote a starter, enforcing exactly-<=STARTERS starters. Returns a
 * short status string. Only operates within a single team's roster.
 */
export async function setStarter(contractId: string, makeStarter: boolean) {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    select: { id: true, teamId: true, isStarter: true },
  });
  if (!contract) return "not-found";
  if (contract.isStarter === makeStarter) return "no-change";

  if (makeStarter) {
    const count = await prisma.contract.count({
      where: { teamId: contract.teamId, isStarter: true },
    });
    if (count >= STARTERS) return "starters-full";
  }

  await prisma.contract.update({
    where: { id: contractId },
    data: { isStarter: makeStarter },
  });
  return "ok";
}
