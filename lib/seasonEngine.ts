// Season simulation + read helpers (DB layer). No Next request context.

import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { simulateGame, type SimPlayer } from "@/lib/sim";
import { WIZ } from "@/lib/data/nba";

/** Draft is complete when slots exist and none are unfilled. */
export async function isDraftComplete(seasonId: string) {
  const [picks, open] = await Promise.all([
    prisma.draftPick.count({ where: { seasonId } }),
    prisma.draftPick.count({ where: { seasonId, playerId: null } }),
  ]);
  return picks > 0 && open === 0;
}

async function insertChunked<T>(rows: T[], fn: (chunk: T[]) => Promise<unknown>) {
  const SIZE = 1000;
  for (let i = 0; i < rows.length; i += SIZE) {
    await fn(rows.slice(i, i + SIZE));
  }
}

/** Each team's roster as SimPlayers, keyed by team id. Shared by season + playoffs. */
export async function loadSimRosters(): Promise<Record<string, SimPlayer[]>> {
  const teams = await prisma.team.findMany({
    select: {
      id: true,
      contracts: {
        select: {
          isStarter: true,
          player: { select: { id: true, currentOverall: true, position: true } },
        },
      },
    },
  });
  const rosters: Record<string, SimPlayer[]> = {};
  for (const t of teams) {
    rosters[t.id] = t.contracts.map((c) => ({
      playerId: c.player.id,
      currentOverall: c.player.currentOverall,
      position: c.player.position,
      isStarter: c.isStarter,
    }));
  }
  return rosters;
}

/**
 * Simulate a full regular season: a double round-robin (every team hosts every
 * other team once → home + away), each game producing per-player box scores.
 * Clears any prior regular-season games for the season first (idempotent re-sim).
 */
export async function simulateRegularSeason(seasonId: string) {
  await prisma.boxScoreLine.deleteMany({
    where: { game: { seasonId, isPlayoff: false } },
  });
  await prisma.game.deleteMany({ where: { seasonId, isPlayoff: false } });

  const teams = await prisma.team.findMany({ select: { id: true } });
  const rosters = await loadSimRosters();

  const games: {
    id: string;
    seasonId: string;
    homeTeamId: string;
    awayTeamId: string;
    homeScore: number;
    awayScore: number;
    isPlayoff: boolean;
    round: string;
    playedAt: Date;
  }[] = [];
  const lines: {
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
  }[] = [];

  const base = Date.now();
  let idx = 0;
  for (let i = 0; i < teams.length; i++) {
    for (let j = 0; j < teams.length; j++) {
      if (i === j) continue;
      const home = teams[i];
      const away = teams[j];
      const res = simulateGame(rosters[home.id], rosters[away.id]);
      const gid = randomUUID();
      games.push({
        id: gid,
        seasonId,
        homeTeamId: home.id,
        awayTeamId: away.id,
        homeScore: res.homeScore,
        awayScore: res.awayScore,
        isPlayoff: false,
        round: "regular",
        playedAt: new Date(base + idx * 60_000),
      });
      idx++;
      for (const l of res.homeLines)
        lines.push({ id: randomUUID(), gameId: gid, teamId: home.id, ...l });
      for (const l of res.awayLines)
        lines.push({ id: randomUUID(), gameId: gid, teamId: away.id, ...l });
    }
  }

  await insertChunked(games, (chunk) =>
    prisma.game.createMany({ data: chunk }),
  );
  await insertChunked(lines, (chunk) =>
    prisma.boxScoreLine.createMany({ data: chunk }),
  );

  return { games: games.length, boxLines: lines.length };
}

export interface TeamRecord {
  teamId: string;
  wins: number;
  losses: number;
}

/** Win/loss per team from regular-season games. */
export async function standingsForSeason(
  seasonId: string,
): Promise<Record<string, TeamRecord>> {
  const games = await prisma.game.findMany({
    where: { seasonId, isPlayoff: false },
    select: { homeTeamId: true, awayTeamId: true, homeScore: true, awayScore: true },
  });
  const rec: Record<string, TeamRecord> = {};
  const bump = (id: string, win: boolean) => {
    rec[id] ??= { teamId: id, wins: 0, losses: 0 };
    if (win) rec[id].wins++;
    else rec[id].losses++;
  };
  for (const g of games) {
    const homeWon = g.homeScore > g.awayScore;
    bump(g.homeTeamId, homeWon);
    bump(g.awayTeamId, !homeWon);
  }
  return rec;
}

export async function hasGames(seasonId: string) {
  return (await prisma.game.count({ where: { seasonId, isPlayoff: false } })) > 0;
}

/** Washington's regular-season games, most recent first, from WAS's view. */
export async function wizardsGames(seasonId: string) {
  const wiz = await prisma.team.findFirst({ where: { abbreviation: WIZ } });
  if (!wiz) return { wizId: null, games: [] as WizGame[] };

  const games = await prisma.game.findMany({
    where: {
      seasonId,
      isPlayoff: false,
      OR: [{ homeTeamId: wiz.id }, { awayTeamId: wiz.id }],
    },
    orderBy: { playedAt: "asc" },
    include: { homeTeam: true, awayTeam: true },
  });

  const mapped: WizGame[] = games.map((g) => {
    const home = g.homeTeamId === wiz.id;
    const opp = home ? g.awayTeam : g.homeTeam;
    const wizScore = home ? g.homeScore : g.awayScore;
    const oppScore = home ? g.awayScore : g.homeScore;
    return {
      id: g.id,
      home,
      oppAbbr: opp.abbreviation,
      oppColor: opp.primaryColor,
      wizScore,
      oppScore,
      win: wizScore > oppScore,
    };
  });
  return { wizId: wiz.id, games: mapped };
}

export interface WizGame {
  id: string;
  home: boolean;
  oppAbbr: string;
  oppColor: string;
  wizScore: number;
  oppScore: number;
  win: boolean;
}

/** Full box score for one game, grouped by team and sorted by points. */
export async function gameBox(gameId: string) {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: { homeTeam: true, awayTeam: true },
  });
  if (!game) return null;

  const lines = await prisma.boxScoreLine.findMany({
    where: { gameId },
    include: { player: { select: { id: true, name: true, position: true } } },
    orderBy: { points: "desc" },
  });

  return {
    game,
    home: lines.filter((l) => l.teamId === game.homeTeamId),
    away: lines.filter((l) => l.teamId === game.awayTeamId),
  };
}
