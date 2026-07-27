import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { WIZ } from "@/lib/data/nba";
import { getTradeRoster } from "@/lib/tradeEngine";
import TeamBadge from "@/components/TeamBadge";
import TradeMachine, { type RosterItem } from "./TradeMachine";

export const dynamic = "force-dynamic";

const toItem = (a: Awaited<ReturnType<typeof getTradeRoster>>[number]): RosterItem => ({
  playerId: a.playerId,
  name: a.name,
  position: a.position,
  overall: a.overall,
  age: a.age,
  yearsRemaining: a.yearsRemaining,
  salary: a.salary,
});

export default async function TradesPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string }>;
}) {
  const { team: teamParam } = await searchParams;
  const wasTeam = await prisma.team.findFirst({ where: { abbreviation: WIZ } });
  const wasRosterRaw = wasTeam ? await getTradeRoster(wasTeam.id) : [];

  if (!wasTeam || wasRosterRaw.length === 0) {
    return (
      <div className="max-w-lg">
        <h1 className="text-xl font-extrabold uppercase tracking-wide text-white mb-2">
          Trades
        </h1>
        <p className="text-slate-400 text-sm">
          You need a roster first. Finish the{" "}
          <Link href="/draft" className="underline text-white">
            draft
          </Link>{" "}
          to start making trades.
        </p>
      </div>
    );
  }

  const cpuTeams = await prisma.team.findMany({
    where: { abbreviation: { not: WIZ } },
    orderBy: { name: "asc" },
    select: { id: true, abbreviation: true, name: true, primaryColor: true },
  });
  const selected =
    cpuTeams.find((t) => t.abbreviation === (teamParam ?? "").toUpperCase()) ??
    cpuTeams[0];
  const cpuRosterRaw = await getTradeRoster(selected.id);

  const trades = await prisma.trade.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    include: {
      initiatingTeam: { select: { abbreviation: true, primaryColor: true } },
      otherTeam: { select: { abbreviation: true, primaryColor: true } },
    },
  });

  const statusColor: Record<string, string> = {
    accepted: "#34d399",
    countered: "#fbbf24",
    rejected: "#f87171",
    invalid: "#f87171",
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-extrabold uppercase tracking-wide text-white mb-1">
        Trades
      </h1>
      <p className="text-slate-500 text-xs mb-4">
        Build a deal with another team. The CPU weighs total value (overall, age,
        contract years) and cap fit, then accepts, counters, or rejects.
      </p>

      <div className="flex flex-wrap gap-1.5 mb-6">
        {cpuTeams.map((t) => (
          <Link key={t.id} href={`/trades?team=${t.abbreviation}`}>
            <TeamBadge
              abbr={t.abbreviation}
              color={t.primaryColor}
              size={t.id === selected.id ? 34 : 28}
            />
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <TeamBadge abbr={selected.abbreviation} color={selected.primaryColor} size={26} />
        <span className="text-white font-bold text-sm">{selected.name}</span>
      </div>

      <TradeMachine
        cpuTeamId={selected.id}
        cpuAbbr={selected.abbreviation}
        wasRoster={wasRosterRaw.map(toItem)}
        cpuRoster={cpuRosterRaw.map(toItem)}
      />

      {trades.length > 0 && (
        <div className="mt-8">
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-2">
            Recent Trade Activity
          </div>
          <div className="space-y-1">
            {trades.map((t) => {
              const assets = JSON.parse(t.assets) as {
                fromInitiating: { playerIds: string[] };
                fromOther: { playerIds: string[] };
              };
              return (
                <div
                  key={t.id}
                  className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-md bg-white/5"
                >
                  <TeamBadge
                    abbr={t.initiatingTeam.abbreviation}
                    color={t.initiatingTeam.primaryColor}
                    size={16}
                  />
                  <span className="text-slate-400">
                    {assets.fromInitiating.playerIds.length}↔
                    {assets.fromOther.playerIds.length}
                  </span>
                  <TeamBadge
                    abbr={t.otherTeam.abbreviation}
                    color={t.otherTeam.primaryColor}
                    size={16}
                  />
                  <span
                    className="ml-auto font-bold uppercase text-[10px] tracking-wide"
                    style={{ color: statusColor[t.status] ?? "#94a3b8" }}
                  >
                    {t.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
