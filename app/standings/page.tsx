import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  isDraftComplete,
  hasGames,
  wizardsGames,
} from "@/lib/seasonEngine";
import TeamBadge from "@/components/TeamBadge";
import { simulateSeason } from "./actions";

export const dynamic = "force-dynamic";

export default async function StandingsPage() {
  const season = await prisma.season.findFirst({ orderBy: { year: "desc" } });

  if (!season || !(await isDraftComplete(season.id))) {
    return (
      <div className="max-w-lg">
        <h1 className="text-xl font-extrabold uppercase tracking-wide text-white mb-2">
          Standings
        </h1>
        <p className="text-slate-400 text-sm">
          Finish the{" "}
          <Link href="/draft" className="underline text-white">
            draft
          </Link>{" "}
          first — every roster must be set before the season can be simulated.
        </p>
      </div>
    );
  }

  const played = await hasGames(season.id);

  if (!played) {
    return (
      <div className="max-w-lg">
        <h1 className="text-xl font-extrabold uppercase tracking-wide text-white mb-2">
          Standings — {season.year}
        </h1>
        <p className="text-slate-400 text-sm mb-6">
          Rosters are set. Simulate the regular season — every team plays every
          other team home and away (870 games), each producing a real box score.
        </p>
        <form action={simulateSeason}>
          <button
            type="submit"
            className="px-5 py-3 rounded-lg text-white font-bold uppercase tracking-wider text-sm"
            style={{ background: "var(--wiz-red)" }}
          >
            Simulate Season
          </button>
        </form>
      </div>
    );
  }

  const { games } = await wizardsGames(season.id);
  const wins = games.filter((g) => g.win).length;
  const losses = games.length - wins;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-extrabold uppercase tracking-wide text-white">
          Standings — {season.year}
        </h1>
        <form action={simulateSeason}>
          <button
            type="submit"
            className="text-xs text-slate-500 hover:text-red-400 underline"
          >
            Re-simulate
          </button>
        </form>
      </div>

      <div className="rounded-xl p-4 mb-6 border border-[var(--panel-border)] bg-[var(--panel)]">
        <div className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-1">
          Washington Wizards
        </div>
        <div className="text-2xl font-mono font-bold text-white">
          {wins}–{losses}
        </div>
        <div className="text-xs text-slate-500 mt-1">
          {games.length} games · click any game for the full box score
        </div>
      </div>

      <p className="text-xs text-slate-500 mb-4">
        Full conference standings and the playoff bracket arrive in Phase 5. For
        now, here is Washington&apos;s schedule.
      </p>

      <div className="grid sm:grid-cols-2 gap-1.5">
        {games.map((g) => (
          <Link
            key={g.id}
            href={`/standings/game/${g.id}`}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10"
          >
            <span
              className="text-xs font-bold w-4 shrink-0"
              style={{ color: g.win ? "#34d399" : "#f87171" }}
            >
              {g.win ? "W" : "L"}
            </span>
            <span className="text-xs text-slate-500 w-6 shrink-0">
              {g.home ? "vs" : "@"}
            </span>
            <TeamBadge abbr={g.oppAbbr} color={g.oppColor} size={20} />
            <span className="text-sm text-white font-mono ml-auto">
              {g.wizScore}–{g.oppScore}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
