// Franchise history aggregation — per-season champions, MVPs, and the Wizards'
// record + playoff result across all simulated seasons.

import { prisma } from "@/lib/prisma";
import { WIZ } from "@/lib/data/nba";
import { standingsForSeason } from "@/lib/seasonEngine";
import type { BracketJSON, SeriesJSON } from "@/lib/playoffEngine";

export interface SeasonSummary {
  year: number;
  championName: string | null;
  championAbbr: string | null;
  championColor: string | null;
  mvpName: string | null;
  finalsMvpName: string | null;
  wizWins: number;
  wizLosses: number;
  wizResult: string;
}

const ROUND_RANK: Record<string, number> = { R1: 1, R2: 2, CONF: 3, FINALS: 4 };
const LOST_LABEL: Record<string, string> = {
  R1: "Lost 1st Round",
  R2: "Lost 2nd Round",
  CONF: "Lost Conf Finals",
};

function wizPlayoffResult(bracketStr: string | null, wasId: string): string {
  if (!bracketStr) return "Missed Playoffs";
  const b = JSON.parse(bracketStr) as BracketJSON;
  const series: SeriesJSON[] = [
    ...b.east.round1, ...b.east.round2, b.east.confFinal,
    ...b.west.round1, ...b.west.round2, b.west.confFinal,
    b.finals,
  ];
  const mine = series.filter((s) => s.higherId === wasId || s.lowerId === wasId);
  if (mine.length === 0) return "Missed Playoffs";
  mine.sort((a, b) => ROUND_RANK[a.round] - ROUND_RANK[b.round]);
  const deepest = mine[mine.length - 1];
  if (deepest.round === "FINALS")
    return deepest.winnerId === wasId ? "Champion" : "Lost Finals";
  return LOST_LABEL[deepest.round] ?? "Made Playoffs";
}

export async function seasonSummaries(): Promise<SeasonSummary[]> {
  const wasTeam = await prisma.team.findFirst({ where: { abbreviation: WIZ } });
  const seasons = await prisma.season.findMany({
    where: { games: { some: {} } },
    orderBy: { year: "asc" },
    include: {
      championTeam: { select: { name: true, abbreviation: true, primaryColor: true } },
      awards: {
        where: { type: { in: ["MVP", "FinalsMVP"] } },
        include: { player: { select: { name: true } } },
      },
    },
  });

  const out: SeasonSummary[] = [];
  for (const s of seasons) {
    const standings = await standingsForSeason(s.id);
    const rec = wasTeam ? standings[wasTeam.id] : undefined;
    const mvp = s.awards.find((a) => a.type === "MVP");
    const fmvp = s.awards.find((a) => a.type === "FinalsMVP");
    out.push({
      year: s.year,
      championName: s.championTeam?.name ?? null,
      championAbbr: s.championTeam?.abbreviation ?? null,
      championColor: s.championTeam?.primaryColor ?? null,
      mvpName: mvp?.player?.name ?? null,
      finalsMvpName: fmvp?.player?.name ?? null,
      wizWins: rec?.wins ?? 0,
      wizLosses: rec?.losses ?? 0,
      wizResult: wasTeam ? wizPlayoffResult(s.bracket, wasTeam.id) : "—",
    });
  }
  return out;
}
