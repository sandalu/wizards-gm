// Awards engine — computes and persists season-end awards from regular-season
// box scores + standings. Runs after the playoffs (needs the Finals MVP).

import { prisma } from "@/lib/prisma";
import { WIZ } from "@/lib/data/nba";
import { standingsForSeason } from "@/lib/seasonEngine";

interface Cand {
  playerId: string;
  teamId: string;
  position: string;
  careerStage: string;
  isStarter: boolean;
  games: number;
  statVal: number; // per-game production value
  mvpScore: number; // statVal blended with team success
  defScore: number; // defensive value
}

const DEF_POS_W: Record<string, number> = {
  C: 1.15,
  PF: 1.1,
  SF: 1.0,
  SG: 0.95,
  PG: 0.95,
};

async function buildCandidates(seasonId: string): Promise<Cand[]> {
  const [agg, players, standings] = await Promise.all([
    prisma.boxScoreLine.groupBy({
      by: ["playerId"],
      where: { game: { seasonId, isPlayoff: false } },
      _sum: {
        points: true,
        rebounds: true,
        assists: true,
        steals: true,
        blocks: true,
        turnovers: true,
      },
      _count: { _all: true },
    }),
    prisma.player.findMany({
      where: { contract: { isNot: null } },
      select: {
        id: true,
        position: true,
        careerStage: true,
        contract: { select: { teamId: true, isStarter: true } },
      },
    }),
    standingsForSeason(seasonId),
  ]);

  const meta = new Map(players.map((p) => [p.id, p]));
  const winPct = (teamId: string) => {
    const r = standings[teamId];
    if (!r || r.wins + r.losses === 0) return 0;
    return r.wins / (r.wins + r.losses);
  };

  const cands: Cand[] = [];
  for (const a of agg) {
    const m = meta.get(a.playerId);
    if (!m || !m.contract) continue;
    const g = a._count._all;
    if (g === 0) continue;
    const s = a._sum;
    const pg = {
      pts: (s.points ?? 0) / g,
      reb: (s.rebounds ?? 0) / g,
      ast: (s.assists ?? 0) / g,
      stl: (s.steals ?? 0) / g,
      blk: (s.blocks ?? 0) / g,
      to: (s.turnovers ?? 0) / g,
    };
    const statVal =
      pg.pts + 0.4 * pg.reb + 0.7 * pg.ast + pg.stl + pg.blk - 0.5 * pg.to;
    const wp = winPct(m.contract.teamId);
    const defScore =
      (pg.stl * 1.9 + pg.blk * 2.3 + pg.reb * 0.35) *
        (DEF_POS_W[m.position] ?? 1) +
      wp * 3;

    cands.push({
      playerId: a.playerId,
      teamId: m.contract.teamId,
      position: m.position,
      careerStage: m.careerStage,
      isStarter: m.contract.isStarter,
      games: g,
      statVal,
      mvpScore: statVal + wp * 8,
      defScore,
    });
  }
  return cands;
}

/** Coach of the Year: biggest win improvement over the prior season for a CPU
 *  team; falls back to the best CPU record if there's no prior season. */
async function coachOfTheYearTeam(
  seasonId: string,
  seasonYear: number,
): Promise<string | null> {
  const teams = await prisma.team.findMany({
    select: { id: true, abbreviation: true },
  });
  const cpu = teams.filter((t) => t.abbreviation !== WIZ);
  const thisStand = await standingsForSeason(seasonId);

  const prior = await prisma.season.findFirst({
    where: { year: seasonYear - 1 },
    select: { id: true },
  });

  if (prior) {
    const priorStand = await standingsForSeason(prior.id);
    let bestTeam: string | null = null;
    let bestImp = -Infinity;
    for (const t of cpu) {
      const now = thisStand[t.id]?.wins ?? 0;
      const was = priorStand[t.id]?.wins ?? 0;
      const imp = now - was;
      if (imp > bestImp) {
        bestImp = imp;
        bestTeam = t.id;
      }
    }
    return bestTeam;
  }

  // No prior season: best record among CPU teams.
  let bestTeam: string | null = null;
  let bestWins = -1;
  for (const t of cpu) {
    const w = thisStand[t.id]?.wins ?? 0;
    if (w > bestWins) {
      bestWins = w;
      bestTeam = t.id;
    }
  }
  return bestTeam;
}

type AwardRow = {
  seasonId: string;
  type: string;
  playerId: string | null;
  teamId: string;
  rank: number;
};

/** Compute + persist all season awards. Idempotent (clears prior awards). */
export async function computeSeasonAwards(seasonId: string) {
  const season = await prisma.season.findUnique({ where: { id: seasonId } });
  if (!season) return;

  const cands = await buildCandidates(seasonId);
  if (cands.length === 0) return;

  const byMvp = [...cands].sort((a, b) => b.mvpScore - a.mvpScore);
  const byDef = [...cands].sort((a, b) => b.defScore - a.defScore);
  const byStat = [...cands].sort((a, b) => b.statVal - a.statVal);

  const rows: AwardRow[] = [];
  const add = (type: string, c: Cand | undefined, rank = 1) => {
    if (c) rows.push({ seasonId, type, playerId: c.playerId, teamId: c.teamId, rank });
  };

  // Individual awards
  add("MVP", byMvp[0]);
  add("DPOY", byDef[0]);
  add("6MOY", byStat.find((c) => !c.isStarter));

  // ROY: best rookie by production; if no rookie cracked a rotation (common in
  // the all-time initial draft), fall back to the highest-rated rostered rookie.
  const royCand = byMvp.find((c) => c.careerStage === "rookie");
  if (royCand) {
    add("ROY", royCand);
  } else {
    const rk = await prisma.player.findFirst({
      where: { careerStage: "rookie", contract: { isNot: null } },
      orderBy: { currentOverall: "desc" },
      select: { id: true, contract: { select: { teamId: true } } },
    });
    if (rk?.contract)
      rows.push({ seasonId, type: "ROY", playerId: rk.id, teamId: rk.contract.teamId, rank: 1 });
  }

  // All-NBA 1st / 2nd / 3rd (top 15 by MVP score)
  const allNba = byMvp.slice(0, 15);
  allNba.forEach((c, i) => {
    const team = i < 5 ? "AllNBA1st" : i < 10 ? "AllNBA2nd" : "AllNBA3rd";
    add(team, c, (i % 5) + 1);
  });

  // All-Defensive 1st Team (top 5 by defensive score)
  byDef.slice(0, 5).forEach((c, i) => add("AllDefense1st", c, i + 1));

  // Coach of the Year (team award — no player)
  const coyTeam = await coachOfTheYearTeam(seasonId, season.year);
  if (coyTeam) rows.push({ seasonId, type: "COY", playerId: null, teamId: coyTeam, rank: 1 });

  // Finals MVP (from the playoffs)
  if (season.finalsMvpId && season.championTeamId) {
    rows.push({
      seasonId,
      type: "FinalsMVP",
      playerId: season.finalsMvpId,
      teamId: season.championTeamId,
      rank: 1,
    });
  }

  await prisma.award.deleteMany({ where: { seasonId } });
  await prisma.award.createMany({ data: rows });

  return { count: rows.length };
}
