import Link from "next/link";
import { Trophy, Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  isDraftComplete,
  hasGames,
  standingsForSeason,
  wizardsGames,
} from "@/lib/seasonEngine";
import type { BracketJSON, SeriesJSON } from "@/lib/playoffEngine";
import { WIZ } from "@/lib/data/nba";
import TeamBadge from "@/components/TeamBadge";
import { simulateSeason, runPostseason, advanceToOffseason } from "./actions";

export const dynamic = "force-dynamic";

function pctStr(w: number, l: number) {
  if (w + l === 0) return ".000";
  return (w / (w + l)).toFixed(3).replace(/^0/, "");
}

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

  const [standings, teamsRaw, wiz] = await Promise.all([
    standingsForSeason(season.id),
    prisma.team.findMany({
      select: {
        id: true,
        abbreviation: true,
        name: true,
        primaryColor: true,
        conference: true,
      },
    }),
    wizardsGames(season.id),
  ]);

  const teamMap = new Map(teamsRaw.map((t) => [t.id, t]));
  const wins = wiz.games.filter((g) => g.win).length;
  const losses = wiz.games.length - wins;

  const confRows = (conf: string) =>
    teamsRaw
      .filter((t) => t.conference === conf)
      .map((t) => ({ t, rec: standings[t.id] ?? { wins: 0, losses: 0 } }))
      .sort(
        (a, b) =>
          b.rec.wins / (b.rec.wins + b.rec.losses || 1) -
            a.rec.wins / (a.rec.wins + a.rec.losses || 1) ||
          b.rec.wins - a.rec.wins,
      );

  const bracket: BracketJSON | null = season.bracket
    ? JSON.parse(season.bracket)
    : null;

  const finalsMvp = season.finalsMvpId
    ? await prisma.player.findUnique({
        where: { id: season.finalsMvpId },
        select: { name: true, position: true },
      })
    : null;

  const awards = bracket
    ? await prisma.award.findMany({
        where: { seasonId: season.id },
        include: {
          player: { select: { name: true, position: true } },
          team: { select: { abbreviation: true, primaryColor: true, name: true } },
        },
        orderBy: { rank: "asc" },
      })
    : [];
  type AwardRec = (typeof awards)[number];
  const awardsByType = new Map<string, AwardRec[]>();
  for (const a of awards) {
    const arr = awardsByType.get(a.type) ?? [];
    arr.push(a);
    awardsByType.set(a.type, arr);
  }
  const solo = (type: string) => awardsByType.get(type)?.[0];

  const ConfTable = ({ conf, label }: { conf: string; label: string }) => (
    <div>
      <div className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-2">
        {label}
      </div>
      <div className="space-y-0.5">
        {confRows(conf).map(({ t, rec }, i) => (
          <div
            key={t.id}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs"
            style={{
              background:
                t.abbreviation === WIZ
                  ? "rgba(227,24,55,0.15)"
                  : i < 8
                    ? "rgba(255,255,255,0.04)"
                    : "transparent",
            }}
          >
            <span className="w-4 text-slate-500 font-mono">{i + 1}</span>
            <TeamBadge abbr={t.abbreviation} color={t.primaryColor} size={20} />
            <span className="text-white flex-1 truncate">{t.name}</span>
            <span className="text-slate-400 font-mono">
              {rec.wins}-{rec.losses}
            </span>
            <span className="text-slate-500 font-mono w-9 text-right">
              {pctStr(rec.wins, rec.losses)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const Series = ({ s, compact }: { s: SeriesJSON; compact?: boolean }) => {
    const hi = teamMap.get(s.higherId);
    const lo = teamMap.get(s.lowerId);
    if (!hi || !lo) return null;
    const hiWon = s.winnerId === s.higherId;
    return (
      <div className="flex items-center gap-2 text-xs py-0.5">
        <TeamBadge abbr={hi.abbreviation} color={hi.primaryColor} size={16} />
        <span className={hiWon ? "text-white font-bold" : "text-slate-500"}>
          {hi.abbreviation}
          {!compact && (
            <span className="text-slate-600"> ({s.seedHigher})</span>
          )}
        </span>
        <span className="font-mono text-slate-400">
          {s.winsHigher}-{s.winsLower}
        </span>
        <span className={!hiWon ? "text-white font-bold" : "text-slate-500"}>
          {lo.abbreviation}
          {!compact && <span className="text-slate-600"> ({s.seedLower})</span>}
        </span>
        <TeamBadge abbr={lo.abbreviation} color={lo.primaryColor} size={16} />
      </div>
    );
  };

  const ConfBracketCol = ({
    data,
    label,
  }: {
    data: BracketJSON["east"];
    label: string;
  }) => (
    <div>
      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mb-1">
        {label} · Round 1
      </div>
      {data.round1.map((s, i) => (
        <Series key={i} s={s} />
      ))}
      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mt-2 mb-1">
        Semifinals
      </div>
      {data.round2.map((s, i) => (
        <Series key={i} s={s} />
      ))}
      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mt-2 mb-1">
        {label} Finals
      </div>
      <Series s={data.confFinal} />
    </div>
  );

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-extrabold uppercase tracking-wide text-white">
          Standings — {season.year}
        </h1>
        <div className="flex gap-3 items-center">
          {season.isComplete && (
            <form action={advanceToOffseason}>
              <button
                className="text-xs font-semibold px-3 py-1.5 rounded-md text-white"
                style={{ background: "var(--gold)", color: "#0b1220" }}
              >
                Advance to {season.year + 1} →
              </button>
            </form>
          )}
          <form action={simulateSeason}>
            <button className="text-xs text-slate-500 hover:text-red-400 underline">
              Re-simulate
            </button>
          </form>
        </div>
      </div>

      {/* Champion banner */}
      {bracket && season.championTeamId && (
        <div
          className="rounded-xl p-4 mb-6 text-center"
          style={{
            background:
              "linear-gradient(135deg, rgba(212,175,55,0.18), rgba(255,255,255,0.03))",
            border: "1px solid rgba(212,175,55,0.4)",
          }}
        >
          <Trophy className="mx-auto mb-2" color="var(--gold)" size={26} />
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            {season.year} NBA Champion
          </div>
          <div className="text-white font-bold text-lg">
            {teamMap.get(season.championTeamId)?.name}
          </div>
          {finalsMvp && (
            <div className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1">
              <Star size={12} color="var(--gold)" /> Finals MVP: {finalsMvp.name}{" "}
              <span className="text-slate-500">{finalsMvp.position}</span>
            </div>
          )}
        </div>
      )}

      {/* Awards */}
      {awards.length > 0 && (
        <div className="rounded-xl p-4 mb-6 border border-[var(--panel-border)] bg-[var(--panel)]">
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-3">
            {season.year} Awards
          </div>
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 mb-4">
            {(
              [
                ["MVP", "Most Valuable Player"],
                ["FinalsMVP", "Finals MVP"],
                ["DPOY", "Defensive Player of the Year"],
                ["ROY", "Rookie of the Year"],
                ["6MOY", "Sixth Man of the Year"],
              ] as const
            ).map(([type, label]) => {
              const a = solo(type);
              if (!a) return null;
              return (
                <div key={type} className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide w-28 shrink-0">
                    {label}
                  </span>
                  <TeamBadge abbr={a.team.abbreviation} color={a.team.primaryColor} size={18} />
                  <span className="text-sm text-white truncate">
                    {a.player?.name}
                  </span>
                  {a.player && (
                    <span className="text-xs text-slate-500 font-mono">
                      {a.player.position}
                    </span>
                  )}
                </div>
              );
            })}
            {solo("COY") && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide w-28 shrink-0">
                  Coach of the Year
                </span>
                <TeamBadge
                  abbr={solo("COY")!.team.abbreviation}
                  color={solo("COY")!.team.primaryColor}
                  size={18}
                />
                <span className="text-sm text-white truncate">
                  {solo("COY")!.team.name}
                </span>
              </div>
            )}
          </div>

          {(["AllNBA1st", "AllNBA2nd", "AllNBA3rd", "AllDefense1st"] as const).map(
            (type) => {
              const list = awardsByType.get(type);
              if (!list || list.length === 0) return null;
              const label =
                type === "AllDefense1st"
                  ? "All-Defensive 1st"
                  : `All-NBA ${type.slice(-3, -2)}${type.endsWith("1st") ? "st" : type.endsWith("2nd") ? "nd" : "rd"}`;
              return (
                <div key={type} className="mb-1.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mr-2">
                    {label}
                  </span>
                  <span className="text-xs text-slate-300">
                    {list
                      .map((a) => `${a.player?.name} (${a.team.abbreviation})`)
                      .join(" · ")}
                  </span>
                </div>
              );
            },
          )}
        </div>
      )}

      {/* Playoffs */}
      <div className="rounded-xl p-4 mb-6 border border-[var(--panel-border)] bg-[var(--panel)]">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">
            Playoffs
          </div>
          <form action={runPostseason}>
            <button
              className="text-xs font-semibold px-3 py-1.5 rounded-md text-white"
              style={{ background: "var(--wiz-red)" }}
            >
              {bracket ? "Re-run playoffs" : "Run Playoffs"}
            </button>
          </form>
        </div>
        {bracket ? (
          <div className="grid sm:grid-cols-2 gap-6">
            <ConfBracketCol data={bracket.east} label="East" />
            <ConfBracketCol data={bracket.west} label="West" />
            <div className="sm:col-span-2 border-t border-white/10 pt-3">
              <div className="text-[10px] text-[var(--gold)] font-bold uppercase tracking-widest mb-1">
                NBA Finals
              </div>
              <Series s={bracket.finals} />
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            Seed the top 8 in each conference and run best-of-7 series through the
            Finals.
          </p>
        )}
      </div>

      {/* Conference standings */}
      <div className="grid sm:grid-cols-2 gap-6 mb-8">
        <ConfTable conf="E" label="Eastern Conference" />
        <ConfTable conf="W" label="Western Conference" />
      </div>

      {/* Wizards schedule */}
      <div className="mb-2 flex items-baseline gap-3">
        <span className="text-xs text-slate-500 font-bold uppercase tracking-wide">
          Wizards Schedule
        </span>
        <span className="text-xs text-slate-400 font-mono">
          {wins}–{losses}
        </span>
      </div>
      <div className="grid sm:grid-cols-2 gap-1.5">
        {wiz.games.map((g) => (
          <Link
            key={g.id}
            href={`/standings/game/${g.id}`}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10"
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
            <TeamBadge abbr={g.oppAbbr} color={g.oppColor} size={18} />
            <span className="text-sm text-white font-mono ml-auto">
              {g.wizScore}–{g.oppScore}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
