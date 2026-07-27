import { Trophy } from "lucide-react";
import { seasonSummaries } from "@/lib/history";
import TeamBadge from "@/components/TeamBadge";
import WinTrendChart from "@/components/WinTrendChart";

export const dynamic = "force-dynamic";

const RESULT_COLOR: Record<string, string> = {
  Champion: "#d4af37",
  "Lost Finals": "#c4ced4",
  "Lost Conf Finals": "#93c5fd",
  "Missed Playoffs": "#6b7280",
};

export default async function HistoryPage() {
  const summaries = await seasonSummaries();

  if (summaries.length === 0) {
    return (
      <div className="max-w-lg">
        <h1 className="text-xl font-extrabold uppercase tracking-wide text-white mb-2">
          Franchise History
        </h1>
        <p className="text-slate-400 text-sm">
          No completed seasons yet. Draft, simulate a season, and run the
          playoffs — champions, MVPs, and the Wizards&apos; results will be
          archived here.
        </p>
      </div>
    );
  }

  const trend = summaries.map((s) => ({ year: s.year, wins: s.wizWins }));
  const titles = summaries.filter((s) => s.wizResult === "Champion").length;

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-extrabold uppercase tracking-wide text-white mb-1">
        Franchise History
      </h1>
      <p className="text-slate-500 text-xs mb-6">
        {summaries.length} season{summaries.length > 1 ? "s" : ""} ·{" "}
        {titles} championship{titles === 1 ? "" : "s"} for Washington
      </p>

      {trend.length >= 2 && (
        <div className="rounded-xl p-4 mb-6 border border-[var(--panel-border)] bg-[var(--panel)]">
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-2">
            Wizards Win Trend
          </div>
          <WinTrendChart data={trend} />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500 text-left text-xs uppercase tracking-wide">
              <th className="font-medium py-2 pr-3">Year</th>
              <th className="font-medium py-2 pr-3">Champion</th>
              <th className="font-medium py-2 pr-3">MVP</th>
              <th className="font-medium py-2 pr-3">Finals MVP</th>
              <th className="font-medium py-2 pr-3">Wizards</th>
            </tr>
          </thead>
          <tbody>
            {[...summaries].reverse().map((s) => (
              <tr key={s.year} className="border-t border-white/5">
                <td className="py-2 pr-3 font-mono text-white">{s.year}</td>
                <td className="py-2 pr-3">
                  <span className="flex items-center gap-1.5">
                    {s.championAbbr && (
                      <TeamBadge
                        abbr={s.championAbbr}
                        color={s.championColor ?? "#333"}
                        size={18}
                      />
                    )}
                    <span className="text-slate-200">{s.championName ?? "—"}</span>
                    {s.wizResult === "Champion" && (
                      <Trophy size={12} color="#d4af37" />
                    )}
                  </span>
                </td>
                <td className="py-2 pr-3 text-slate-300">{s.mvpName ?? "—"}</td>
                <td className="py-2 pr-3 text-slate-300">{s.finalsMvpName ?? "—"}</td>
                <td className="py-2 pr-3">
                  <span className="text-white font-mono">
                    {s.wizWins}-{s.wizLosses}
                  </span>{" "}
                  <span
                    className="text-xs"
                    style={{ color: RESULT_COLOR[s.wizResult] ?? "#94a3b8" }}
                  >
                    {s.wizResult}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
