"use server";

import { revalidatePath } from "next/cache";
import { proposeTrade, type TradeDecision } from "@/lib/tradeEngine";

export async function submitTrade(
  otherTeamId: string,
  wasPlayerIds: string[],
  cpuPlayerIds: string[],
): Promise<TradeDecision> {
  const decision = await proposeTrade(otherTeamId, wasPlayerIds, cpuPlayerIds);
  if (decision.status === "accepted") {
    revalidatePath("/trades");
    revalidatePath("/roster");
    revalidatePath("/");
  }
  return decision;
}
