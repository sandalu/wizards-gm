import Link from "next/link";
import { prisma } from "@/lib/prisma";

const SECTIONS = [
  {
    href: "/draft",
    title: "Draft",
    body: "Snake draft the all-time real-player pool. You pick for Washington; the CPU runs the other 29 teams.",
  },
  {
    href: "/roster",
    title: "Roster & Cap",
    body: "Manage your 15-man roster, set the lineup, and watch the salary cap.",
  },
  {
    href: "/standings",
    title: "Standings",
    body: "Simulate the season game-by-game, then chase a title through best-of-7 playoffs.",
  },
  {
    href: "/trades",
    title: "Trades",
    body: "Propose deals to CPU teams. They weigh value, age, contracts, and cap fit.",
  },
  {
    href: "/history",
    title: "Franchise History",
    body: "Champions, MVPs, and the Wizards' record across every simulated season.",
  },
];

export const dynamic = "force-dynamic";

export default async function Home() {
  const [teamCount, playerCount, topPlayers] = await Promise.all([
    prisma.team.count(),
    prisma.player.count(),
    prisma.player.findMany({
      orderBy: { currentOverall: "desc" },
      take: 8,
      select: { id: true, name: true, position: true, currentOverall: true },
    }),
  ]);

  const seeded = teamCount > 0 && playerCount > 0;

  return (
    <div>
      <section className="mb-8">
        <h1 className="text-2xl font-extrabold uppercase tracking-wide text-white">
          Washington Wizards — Front Office
        </h1>
        <p className="text-slate-400 mt-2 max-w-2xl text-sm">
          A persistent NBA franchise simulator. You own the Wizards; the app runs
          the other 29 teams. Every player is a real NBA player. Everything is
          saved to a database, so your franchise survives closing the browser.
        </p>
      </section>

      <section className="mb-8 rounded-xl p-4 border border-[var(--panel-border)] bg-[var(--panel)]">
        <div className="text-xs uppercase tracking-wide text-slate-500 font-bold mb-3">
          League Data
        </div>
        {seeded ? (
          <div className="flex flex-wrap gap-6">
            <div>
              <div className="text-2xl font-mono font-bold text-white">
                {teamCount}
              </div>
              <div className="text-xs text-slate-500">teams</div>
            </div>
            <div>
              <div className="text-2xl font-mono font-bold text-white">
                {playerCount}
              </div>
              <div className="text-xs text-slate-500">real players</div>
            </div>
            <div className="flex-1 min-w-[220px]">
              <div className="text-xs text-slate-500 mb-1.5">
                Top-rated available
              </div>
              <div className="flex flex-wrap gap-1.5">
                {topPlayers.map((p) => (
                  <span
                    key={p.id}
                    className="text-xs rounded-md px-2 py-1 bg-white/5 text-slate-200"
                  >
                    <span className="font-mono text-[var(--gold)]">
                      {p.currentOverall}
                    </span>{" "}
                    {p.name}{" "}
                    <span className="text-slate-500">{p.position}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            No data yet. Run{" "}
            <code className="text-slate-200 bg-white/10 rounded px-1">
              npm run db:seed
            </code>{" "}
            to load the 30 teams and ~450 real players.
          </p>
        )}
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="rounded-xl p-4 border border-[var(--panel-border)] bg-[var(--panel)] hover:border-[var(--wiz-red)] transition-colors"
          >
            <div className="text-white font-bold text-sm uppercase tracking-wide">
              {s.title}
            </div>
            <div className="text-slate-400 text-xs mt-1.5 leading-relaxed">
              {s.body}
            </div>
          </Link>
        ))}
      </div>

      <p className="text-slate-600 text-xs mt-8">
        Phases 0–1 complete — scaffold, schema, navigation, and a seeded league of
        30 real teams and {playerCount} real players. Draft is next.
      </p>
    </div>
  );
}
