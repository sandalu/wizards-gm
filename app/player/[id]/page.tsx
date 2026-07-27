import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface SeasonAgg {
  year: number;
  gp: number;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
}

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const player = await prisma.player.findUnique({
    where: { id },
    include: { contract: { include: { team: true } } },
  });
  if (!player) notFound();

  const lines = await prisma.boxScoreLine.findMany({
    where: { playerId: id, game: { isPlayoff: false } },
    select: {
      points: true,
      rebounds: true,
      assists: true,
      steals: true,
      blocks: true,
      game: { select: { season: { select: { year: true } } } },
    },
  });

  // Aggregate per season.
  const byYear = new Map<number, SeasonAgg>();
  for (const l of lines) {
    const y = l.game.season.year;
    const a = byYear.get(y) ?? { year: y, gp: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0 };
    a.gp += 1;
    a.pts += l.points;
    a.reb += l.rebounds;
    a.ast += l.assists;
    a.stl += l.steals;
    a.blk += l.blocks;
    byYear.set(y, a);
  }
  const seasons = [...byYear.values()].sort((a, b) => a.year - b.year);
  const career = seasons.reduce(
    (c, s) => ({
      gp: c.gp + s.gp,
      pts: c.pts + s.pts,
      reb: c.reb + s.reb,
      ast: c.ast + s.ast,
      stl: c.stl + s.stl,
      blk: c.blk + s.blk,
    }),
    { gp: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0 },
  );

  const avg = (total: number, gp: number) => (gp > 0 ? (total / gp).toFixed(1) : "—");

  const status = player.retiredAt
    ? `Retired ${player.retiredAt}`
    : player.contract
      ? player.contract.team.name
      : "Free Agent";

  return (
    <div className="max-w-2xl">
      <div className="flex items-baseline gap-3 mb-1">
        <h1 className="text-2xl font-extrabold text-white">{player.name}</h1>
        {!player.isReal && (
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
            Fictional Prospect
          </span>
        )}
      </div>
      <div className="text-sm text-slate-400 mb-6 font-mono">
        {player.position} · {status} · age {player.age} · OVR{" "}
        <span className="text-[var(--gold)]">{player.currentOverall}</span> ·
        POT {player.potential} · {player.careerStage}
      </div>

      {seasons.length === 0 ? (
        <p className="text-sm text-slate-500">
          No games played yet. Simulate a season to build a career stat line.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-left text-xs uppercase tracking-wide">
                <th className="font-medium py-2 pr-3">Season</th>
                <th className="font-medium py-2 px-2 text-right">GP</th>
                <th className="font-medium py-2 px-2 text-right">PPG</th>
                <th className="font-medium py-2 px-2 text-right">RPG</th>
                <th className="font-medium py-2 px-2 text-right">APG</th>
                <th className="font-medium py-2 px-2 text-right">SPG</th>
                <th className="font-medium py-2 px-2 text-right">BPG</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {seasons.map((s) => (
                <tr key={s.year} className="border-t border-white/5">
                  <td className="py-2 pr-3 text-white">{s.year}</td>
                  <td className="py-2 px-2 text-right text-slate-400">{s.gp}</td>
                  <td className="py-2 px-2 text-right text-white">{avg(s.pts, s.gp)}</td>
                  <td className="py-2 px-2 text-right text-slate-300">{avg(s.reb, s.gp)}</td>
                  <td className="py-2 px-2 text-right text-slate-300">{avg(s.ast, s.gp)}</td>
                  <td className="py-2 px-2 text-right text-slate-300">{avg(s.stl, s.gp)}</td>
                  <td className="py-2 px-2 text-right text-slate-300">{avg(s.blk, s.gp)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-white/15 font-bold">
                <td className="py-2 pr-3 text-white">Career</td>
                <td className="py-2 px-2 text-right text-slate-400">{career.gp}</td>
                <td className="py-2 px-2 text-right text-white">{avg(career.pts, career.gp)}</td>
                <td className="py-2 px-2 text-right text-slate-300">{avg(career.reb, career.gp)}</td>
                <td className="py-2 px-2 text-right text-slate-300">{avg(career.ast, career.gp)}</td>
                <td className="py-2 px-2 text-right text-slate-300">{avg(career.stl, career.gp)}</td>
                <td className="py-2 px-2 text-right text-slate-300">{avg(career.blk, career.gp)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <Link
        href="/roster"
        className="inline-block mt-6 text-xs text-slate-500 hover:text-white"
      >
        ← Back to roster
      </Link>
    </div>
  );
}
