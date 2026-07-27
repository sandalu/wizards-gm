// Playoff engine — seeds the top 8 per conference and runs best-of-7 series with
// the same per-game simulation, through the Finals. Stores the champion, Finals
// MVP, and a bracket JSON snapshot on the Season. DB layer, no request context.

import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { simulateGame, type SimPlayer } from "@/lib/sim";
import { loadSimRosters, standingsForSeason } from "@/lib/seasonEngine";

export interface SeriesJSON {
  higherId: string;
  lowerId: string;
  seedHigher: number;
  seedLower: number;
  winsHigher: number;
  winsLower: number;
  winnerId: string;
  round: string;
}

export interface ConfBracket {
  seeds: string[]; // 8 team ids, seed order
  round1: SeriesJSON[];
  round2: SeriesJSON[];
  confFinal: SeriesJSON;
  champId: string;
}

export interface BracketJSON {
  east: ConfBracket;
  west: ConfBracket;
  finals: SeriesJSON;
  championId: string;
  finalsMvpId: string | null;
}

interface Seed {
  id: string;
  seed: number;
}

type GameRow = {
  id: string;
  seasonId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  isPlayoff: boolean;
  round: string;
  playedAt: Date;
};
type LineRow = {
  id: string;
  gameId: string;
  playerId: string;
  teamId: string;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  minutes: number;
};

/** Higher seed hosts games 1, 2, 5, 7 (2-2-1-1-1). */
const HIGHER_HOME = new Set([0, 1, 4, 6]);

function simulateSeries(
  seasonId: string,
  round: string,
  a: Seed,
  b: Seed,
  rosters: Record<string, SimPlayer[]>,
  games: GameRow[],
  lines: LineRow[],
  clock: { t: number },
): { series: SeriesJSON; winner: Seed } {
  const higher = a.seed <= b.seed ? a : b;
  const lower = a.seed <= b.seed ? b : a;

  let winsHigher = 0;
  let winsLower = 0;
  for (let g = 0; winsHigher < 4 && winsLower < 4; g++) {
    const higherHome = HIGHER_HOME.has(g);
    const homeId = higherHome ? higher.id : lower.id;
    const awayId = higherHome ? lower.id : higher.id;
    const res = simulateGame(rosters[homeId], rosters[awayId]);

    const higherScore = higherHome ? res.homeScore : res.awayScore;
    const lowerScore = higherHome ? res.awayScore : res.homeScore;
    if (higherScore > lowerScore) winsHigher++;
    else winsLower++;

    const gid = randomUUID();
    games.push({
      id: gid,
      seasonId,
      homeTeamId: homeId,
      awayTeamId: awayId,
      homeScore: res.homeScore,
      awayScore: res.awayScore,
      isPlayoff: true,
      round,
      playedAt: new Date(clock.t),
    });
    clock.t += 60_000;
    for (const l of res.homeLines)
      lines.push({ id: randomUUID(), gameId: gid, teamId: homeId, ...l });
    for (const l of res.awayLines)
      lines.push({ id: randomUUID(), gameId: gid, teamId: awayId, ...l });
  }

  const winnerId = winsHigher > winsLower ? higher.id : lower.id;
  return {
    series: {
      higherId: higher.id,
      lowerId: lower.id,
      seedHigher: higher.seed,
      seedLower: lower.seed,
      winsHigher,
      winsLower,
      winnerId,
      round,
    },
    winner: winnerId === higher.id ? higher : lower,
  };
}

function runConference(
  seasonId: string,
  seeds: Seed[], // exactly 8, seed order
  rosters: Record<string, SimPlayer[]>,
  games: GameRow[],
  lines: LineRow[],
  clock: { t: number },
): ConfBracket {
  // Round 1 pairings: 1v8, 4v5, 3v6, 2v7 (indices into the seed list).
  const pairs: [number, number][] = [
    [0, 7],
    [3, 4],
    [2, 5],
    [1, 6],
  ];
  const round1 = pairs.map(([h, l]) =>
    simulateSeries(seasonId, "R1", seeds[h], seeds[l], rosters, games, lines, clock),
  );
  const round2 = [
    simulateSeries(seasonId, "R2", round1[0].winner, round1[1].winner, rosters, games, lines, clock),
    simulateSeries(seasonId, "R2", round1[2].winner, round1[3].winner, rosters, games, lines, clock),
  ];
  const confFinal = simulateSeries(
    seasonId,
    "CONF",
    round2[0].winner,
    round2[1].winner,
    rosters,
    games,
    lines,
    clock,
  );

  return {
    seeds: seeds.map((s) => s.id),
    round1: round1.map((r) => r.series),
    round2: round2.map((r) => r.series),
    confFinal: confFinal.series,
    champId: confFinal.winner.id,
  };
}

/** Run the whole postseason. Requires a simulated regular season. */
export async function runPlayoffs(seasonId: string) {
  // Clear any prior playoff games (idempotent re-run).
  await prisma.boxScoreLine.deleteMany({
    where: { game: { seasonId, isPlayoff: true } },
  });
  await prisma.game.deleteMany({ where: { seasonId, isPlayoff: true } });

  const [standings, teams] = await Promise.all([
    standingsForSeason(seasonId),
    prisma.team.findMany({ select: { id: true, conference: true } }),
  ]);
  const rosters = await loadSimRosters();

  const pct = (id: string) => {
    const r = standings[id];
    if (!r || r.wins + r.losses === 0) return 0;
    return r.wins / (r.wins + r.losses);
  };

  const seedConf = (conf: string): Seed[] =>
    teams
      .filter((t) => t.conference === conf)
      .sort((a, b) => pct(b.id) - pct(a.id) || (standings[b.id]?.wins ?? 0) - (standings[a.id]?.wins ?? 0))
      .slice(0, 8)
      .map((t, i) => ({ id: t.id, seed: i + 1 }));

  const games: GameRow[] = [];
  const lines: LineRow[] = [];
  const clock = { t: Date.now() + 100 * 60_000 }; // after the regular season

  const east = runConference(seasonId, seedConf("E"), rosters, games, lines, clock);
  const west = runConference(seasonId, seedConf("W"), rosters, games, lines, clock);

  // Finals: home court to the better regular-season record.
  const eChamp: Seed = { id: east.champId, seed: pct(east.champId) >= pct(west.champId) ? 1 : 2 };
  const wChamp: Seed = { id: west.champId, seed: eChamp.seed === 1 ? 2 : 1 };
  const finals = simulateSeries(seasonId, "FINALS", eChamp, wChamp, rosters, games, lines, clock);
  const championId = finals.winner.id;

  // Persist all playoff games + box lines.
  const SIZE = 1000;
  for (let i = 0; i < games.length; i += SIZE)
    await prisma.game.createMany({ data: games.slice(i, i + SIZE) });
  for (let i = 0; i < lines.length; i += SIZE)
    await prisma.boxScoreLine.createMany({ data: lines.slice(i, i + SIZE) });

  // Finals MVP: champion's best composite performer across the Finals games.
  const finalsMvpId = await computeFinalsMvp(seasonId, championId);

  const bracket: BracketJSON = {
    east,
    west,
    finals: finals.series,
    championId,
    finalsMvpId,
  };

  await prisma.season.update({
    where: { id: seasonId },
    data: {
      championTeamId: championId,
      finalsMvpId,
      bracket: JSON.stringify(bracket),
      isComplete: true,
    },
  });

  return { championId, finalsMvpId, playoffGames: games.length };
}

async function computeFinalsMvp(seasonId: string, championId: string) {
  const lines = await prisma.boxScoreLine.findMany({
    where: { teamId: championId, game: { seasonId, round: "FINALS" } },
    select: {
      playerId: true,
      points: true,
      rebounds: true,
      assists: true,
      steals: true,
      blocks: true,
    },
  });
  const score: Record<string, number> = {};
  for (const l of lines) {
    score[l.playerId] =
      (score[l.playerId] ?? 0) +
      l.points +
      0.5 * l.rebounds +
      0.5 * l.assists +
      l.steals +
      l.blocks;
  }
  let best: string | null = null;
  let bestVal = -1;
  for (const [pid, val] of Object.entries(score)) {
    if (val > bestVal) {
      bestVal = val;
      best = pid;
    }
  }
  return best;
}
