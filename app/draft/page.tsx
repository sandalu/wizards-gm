import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { WIZ, TOTAL_PLAYERS, ROSTER_SIZE } from "@/lib/data/nba";
import { formatSalary } from "@/lib/cap";
import { startDraft, resetDraft } from "./actions";
import DraftBoard, { type AvailablePlayer } from "./DraftBoard";

export const dynamic = "force-dynamic";

function TeamBadge({
  abbr,
  color,
  size = 24,
}: {
  abbr: string;
  color: string;
  size?: number;
}) {
  return (
    <span
      className="flex items-center justify-center rounded-md font-mono font-bold text-white shrink-0"
      style={{
        width: size,
        height: size,
        background: color,
        fontSize: size * 0.34,
        border: "1px solid rgba(255,255,255,0.2)",
      }}
    >
      {abbr}
    </span>
  );
}

export default async function DraftPage() {
  const season = await prisma.season.findFirst({ orderBy: { year: "desc" } });
  const pickCount = season
    ? await prisma.draftPick.count({ where: { seasonId: season.id } })
    : 0;

  // --- No draft yet: show the intro / start screen ---------------------------
  if (!season || pickCount === 0) {
    const players = await prisma.player.count();
    return (
      <div className="max-w-lg">
        <h1 className="text-xl font-extrabold uppercase tracking-wide text-white mb-2">
          Draft
        </h1>
        <p className="text-slate-400 text-sm mb-6">
          An all-time snake draft: {TOTAL_PLAYERS} real players, {ROSTER_SIZE}{" "}
          rounds, 30 teams. You pick for Washington; every other GM auto-drafts
          the best available. Each pick gets a real contract, saved to the
          database — you can close the tab and resume right where you left off.
        </p>
        {players === 0 ? (
          <p className="text-sm text-amber-400">
            No players loaded. Run <code>npm run db:seed</code> first.
          </p>
        ) : (
          <form action={startDraft}>
            <button
              type="submit"
              className="px-5 py-3 rounded-lg text-white font-bold uppercase tracking-wider text-sm"
              style={{ background: "var(--wiz-red)" }}
            >
              Start Draft
            </button>
          </form>
        )}
      </div>
    );
  }

  // --- Draft in progress (or complete) --------------------------------------
  const [nextSlot, made, wizContracts, availableRaw] = await Promise.all([
    prisma.draftPick.findFirst({
      where: { seasonId: season.id, playerId: null },
      orderBy: { pickNumber: "asc" },
      include: { team: true },
    }),
    prisma.draftPick.findMany({
      where: { seasonId: season.id, playerId: { not: null } },
      orderBy: { pickNumber: "desc" },
      take: 10,
      include: { team: true, player: true },
    }),
    prisma.contract.findMany({
      where: { team: { abbreviation: WIZ } },
      include: { player: true },
      orderBy: { player: { currentOverall: "desc" } },
    }),
    prisma.player.findMany({
      where: { contract: { is: null }, retiredAt: null },
      orderBy: { currentOverall: "desc" },
      select: {
        id: true,
        name: true,
        position: true,
        currentOverall: true,
        careerStage: true,
        age: true,
      },
    }),
  ]);

  const madeCount = pickCount - (await prisma.draftPick.count({
    where: { seasonId: season.id, playerId: null },
  }));
  const complete = !nextSlot;
  const isUserTurn = nextSlot?.team.abbreviation === WIZ;
  const available: AvailablePlayer[] = availableRaw;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-extrabold uppercase tracking-wide text-white">
          Draft — {season.year}
        </h1>
        <span className="text-xs text-slate-400 font-mono">
          {madeCount}/{pickCount}
        </span>
      </div>

      <div className="w-full h-1.5 rounded-full bg-white/10 mb-5 overflow-hidden">
        <div
          className="h-full transition-all"
          style={{
            width: `${(madeCount / pickCount) * 100}%`,
            background: "var(--wiz-red)",
          }}
        />
      </div>

      {complete ? (
        <div className="rounded-xl p-5 border border-[var(--panel-border)] bg-[var(--panel)] mb-6">
          <div className="text-white font-bold mb-1">Draft complete.</div>
          <p className="text-slate-400 text-sm mb-3">
            All {pickCount} picks are in and every roster is set. Head to your
            roster to review the team.
          </p>
          <Link
            href="/roster"
            className="inline-block px-4 py-2 rounded-lg text-white text-sm font-semibold"
            style={{ background: "var(--wiz-red)" }}
          >
            View Roster
          </Link>
        </div>
      ) : (
        nextSlot && (
          <div
            className="rounded-xl p-4 mb-5 flex items-center gap-3"
            style={{
              background: isUserTurn
                ? "rgba(227,24,55,0.18)"
                : "rgba(255,255,255,0.05)",
              border: isUserTurn
                ? "1px solid var(--wiz-red)"
                : "1px solid var(--panel-border)",
            }}
          >
            <TeamBadge
              abbr={nextSlot.team.abbreviation}
              color={nextSlot.team.primaryColor}
              size={36}
            />
            <div className="flex-1">
              <div className="text-xs text-slate-400 font-mono">
                ON THE CLOCK · R{nextSlot.round} · PICK {nextSlot.pickNumber}
              </div>
              <div className="text-white font-bold text-sm">
                {nextSlot.team.name}
              </div>
            </div>
            {isUserTurn && (
              <span className="text-xs text-red-300 font-bold uppercase tracking-wide">
                Your Pick
              </span>
            )}
          </div>
        )
      )}

      <div className="grid md:grid-cols-[1fr_260px] gap-6">
        <div>
          {isUserTurn ? (
            <DraftBoard players={available} />
          ) : (
            !complete && (
              <p className="text-sm text-slate-500">
                The CPU is drafting… reload if this doesn&apos;t update.
              </p>
            )
          )}
        </div>

        <aside className="space-y-6">
          <div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-2">
              Wizards Roster ({wizContracts.length}/{ROSTER_SIZE})
            </div>
            <div className="space-y-1">
              {wizContracts.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-md bg-white/5"
                >
                  <span className="font-mono text-[var(--gold)] w-6">
                    {c.player.currentOverall}
                  </span>
                  <span className="text-white flex-1 truncate">
                    {c.player.name}
                  </span>
                  <span className="text-slate-500 font-mono">
                    {c.player.position}
                  </span>
                  <span className="text-slate-500 font-mono">
                    {formatSalary(c.annualSalary)}
                  </span>
                </div>
              ))}
              {wizContracts.length === 0 && (
                <div className="text-xs text-slate-600">No picks yet.</div>
              )}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-2">
              Recent Picks
            </div>
            <div className="space-y-1">
              {made.map((pk) => (
                <div
                  key={pk.id}
                  className="flex items-center gap-2 text-xs px-1"
                >
                  <TeamBadge
                    abbr={pk.team.abbreviation}
                    color={pk.team.primaryColor}
                    size={18}
                  />
                  <span className="text-white flex-1 truncate">
                    {pk.player?.name}
                  </span>
                  <span className="text-slate-500 font-mono">
                    {pk.player?.currentOverall}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <form action={resetDraft}>
            <button
              type="submit"
              className="text-xs text-slate-500 hover:text-red-400 underline"
            >
              Reset draft
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
