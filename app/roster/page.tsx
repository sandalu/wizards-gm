import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { WIZ, ROSTER_SIZE } from "@/lib/data/nba";
import {
  formatSalary,
  capSummary,
  SALARY_CAP,
  LUXURY_TAX_LINE,
  STARTERS,
} from "@/lib/cap";
import { payrollByTeam } from "@/lib/rosterEngine";
import TeamBadge from "@/components/TeamBadge";
import { toggleStarter } from "./actions";

export const dynamic = "force-dynamic";

const POS_ORDER: Record<string, number> = { PG: 0, SG: 1, SF: 2, PF: 3, C: 4 };

export default async function RosterPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string }>;
}) {
  const { team: teamParam } = await searchParams;
  const teams = await prisma.team.findMany({ orderBy: { name: "asc" } });
  const selectedAbbr = (teamParam ?? WIZ).toUpperCase();
  const team =
    teams.find((t) => t.abbreviation === selectedAbbr) ??
    teams.find((t) => t.abbreviation === WIZ) ??
    teams[0];

  if (!team) {
    return (
      <p className="text-slate-400 text-sm">
        No teams found. Run <code>npm run db:seed</code>.
      </p>
    );
  }

  const [contracts, payroll] = await Promise.all([
    prisma.contract.findMany({
      where: { teamId: team.id },
      include: { player: true },
    }),
    payrollByTeam(),
  ]);

  const isUser = team.abbreviation === WIZ;
  const starters = contracts
    .filter((c) => c.isStarter)
    .sort(
      (a, b) =>
        (POS_ORDER[a.player.position] ?? 9) -
          (POS_ORDER[b.player.position] ?? 9) ||
        b.player.currentOverall - a.player.currentOverall,
    );
  const bench = contracts
    .filter((c) => !c.isStarter)
    .sort((a, b) => b.player.currentOverall - a.player.currentOverall);

  const cap = capSummary(payroll[team.id] ?? 0);

  const Row = ({
    c,
    starter,
  }: {
    c: (typeof contracts)[number];
    starter: boolean;
  }) => (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5">
      <span
        className="flex items-center justify-center rounded-md font-mono font-bold shrink-0"
        style={{
          width: 32,
          height: 32,
          background:
            c.player.currentOverall >= 92
              ? "#d4af37"
              : c.player.currentOverall >= 84
                ? "#c4ced4"
                : c.player.currentOverall >= 75
                  ? "#7fb3d5"
                  : "#6b7280",
          color: "#0b1220",
          fontSize: 13,
        }}
      >
        {c.player.currentOverall}
      </span>
      <span className="flex-1 min-w-0">
        <Link
          href={`/player/${c.playerId}`}
          className="block text-sm font-semibold text-white truncate hover:text-[var(--gold)]"
        >
          {c.player.name}
        </Link>
        <span className="block text-xs text-slate-400 font-mono">
          {c.player.position} · age {c.player.age} · {c.yearsRemaining}yr ·{" "}
          {formatSalary(c.annualSalary)}
        </span>
      </span>
      {isUser && (
        <form action={toggleStarter.bind(null, c.id, !starter)}>
          <button
            type="submit"
            disabled={!starter && starters.length >= STARTERS}
            className="text-xs font-semibold px-2.5 py-1 rounded-md disabled:opacity-30"
            style={{
              background: starter
                ? "rgba(255,255,255,0.1)"
                : "var(--wiz-red)",
              color: "#fff",
            }}
          >
            {starter ? "Bench" : "Start"}
          </button>
        </form>
      )}
    </div>
  );

  return (
    <div>
      <h1 className="text-xl font-extrabold uppercase tracking-wide text-white mb-1">
        Roster &amp; Cap
      </h1>
      <p className="text-slate-500 text-xs mb-4">
        Cap ${SALARY_CAP / 1_000_000}M · luxury-tax line $
        {LUXURY_TAX_LINE / 1_000_000}M. You manage Washington&apos;s lineup.
      </p>

      {/* Team selector */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {teams.map((t) => (
          <Link key={t.id} href={`/roster?team=${t.abbreviation}`}>
            <TeamBadge
              abbr={t.abbreviation}
              color={t.primaryColor}
              size={t.id === team.id ? 34 : 28}
            />
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-[1fr_300px] gap-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <TeamBadge abbr={team.abbreviation} color={team.primaryColor} size={40} />
            <div>
              <div className="text-white font-bold">{team.name}</div>
              <div className="text-xs text-slate-500 font-mono">
                {team.conference === "E" ? "Eastern" : "Western"} ·{" "}
                {contracts.length}/{ROSTER_SIZE} players
                {isUser && " · you"}
              </div>
            </div>
          </div>

          {contracts.length === 0 ? (
            <p className="text-sm text-slate-500">
              This roster is empty. Finish the{" "}
              <Link href="/draft" className="underline">
                draft
              </Link>{" "}
              first.
            </p>
          ) : (
            <>
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-2">
                Starters ({starters.length}/{STARTERS})
              </div>
              <div className="space-y-1.5 mb-5">
                {starters.map((c) => (
                  <Row key={c.id} c={c} starter />
                ))}
                {starters.length === 0 && (
                  <div className="text-xs text-slate-600">No starters set.</div>
                )}
              </div>

              <div className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-2">
                Bench ({bench.length})
              </div>
              <div className="space-y-1.5">
                {bench.map((c) => (
                  <Row key={c.id} c={c} starter={false} />
                ))}
              </div>
            </>
          )}
        </div>

        <aside className="space-y-6">
          {/* Selected team cap summary */}
          <div className="rounded-xl p-4 border border-[var(--panel-border)] bg-[var(--panel)]">
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-3">
              Cap Sheet
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Payroll</span>
                <span className="text-white font-mono">
                  {formatSalary(cap.total)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cap space</span>
                <span
                  className={`font-mono ${cap.space < 0 ? "text-red-400" : "text-emerald-400"}`}
                >
                  {formatSalary(cap.space)}
                </span>
              </div>
              <div className="flex gap-1.5 pt-1">
                {cap.overCap && (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-500/20 text-red-300">
                    Over cap
                  </span>
                )}
                {cap.overTax && (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                    Luxury tax
                  </span>
                )}
                {!cap.overCap && (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    Under cap
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* League cap table */}
          <div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-2">
              League Payroll
            </div>
            <div className="space-y-1">
              {[...teams]
                .map((t) => ({ t, total: payroll[t.id] ?? 0 }))
                .sort((a, b) => b.total - a.total)
                .map(({ t, total }) => {
                  const over = total > SALARY_CAP;
                  return (
                    <Link
                      key={t.id}
                      href={`/roster?team=${t.abbreviation}`}
                      className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded-md ${
                        t.id === team.id ? "bg-white/10" : "hover:bg-white/5"
                      }`}
                    >
                      <TeamBadge
                        abbr={t.abbreviation}
                        color={t.primaryColor}
                        size={18}
                      />
                      <span className="text-slate-300 flex-1 truncate">
                        {t.abbreviation}
                      </span>
                      {over && (
                        <span className="text-[9px] font-bold uppercase text-red-400">
                          over
                        </span>
                      )}
                      <span className="text-slate-400 font-mono">
                        {formatSalary(total)}
                      </span>
                    </Link>
                  );
                })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
