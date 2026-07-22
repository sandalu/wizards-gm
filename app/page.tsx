import Link from "next/link";

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

export default function Home() {
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
        Phase 0 complete — project scaffold, database schema, and navigation.
        Draft, simulation, and trades arrive in later phases.
      </p>
    </div>
  );
}
