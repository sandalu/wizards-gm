"use client";

import { useMemo, useState, useTransition } from "react";
import { Search, ChevronRight } from "lucide-react";
import { userDraft } from "./actions";

export interface AvailablePlayer {
  id: string;
  name: string;
  position: string;
  currentOverall: number;
  careerStage: string;
  age: number;
}

const POSITIONS = ["ALL", "PG", "SG", "SF", "PF", "C"];

function ovrColor(ovr: number) {
  if (ovr >= 92) return "#d4af37";
  if (ovr >= 84) return "#c4ced4";
  if (ovr >= 75) return "#7fb3d5";
  return "#6b7280";
}

export default function DraftBoard({
  players,
}: {
  players: AvailablePlayer[];
}) {
  const [search, setSearch] = useState("");
  const [pos, setPos] = useState("ALL");
  const [pending, startTransition] = useTransition();
  const [pickingId, setPickingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return players
      .filter(
        (p) =>
          (pos === "ALL" || p.position === pos) &&
          (q === "" || p.name.toLowerCase().includes(q)),
      )
      .slice(0, 80);
  }, [players, search, pos]);

  function draft(id: string) {
    setPickingId(id);
    startTransition(async () => {
      await userDraft(id);
      setPickingId(null);
    });
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 bg-white/5 rounded-lg px-3 py-2">
        <Search size={14} className="text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search players"
          className="bg-transparent outline-none text-sm text-white flex-1 placeholder:text-slate-500"
        />
      </div>

      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
        {POSITIONS.map((p) => (
          <button
            key={p}
            onClick={() => setPos(p)}
            className="px-3 py-1 rounded-full text-xs font-semibold font-mono shrink-0"
            style={{
              background: pos === p ? "var(--wiz-red)" : "rgba(255,255,255,0.06)",
              color: "#fff",
            }}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="space-y-1.5 max-h-[28rem] overflow-y-auto pr-1">
        {filtered.map((p) => (
          <button
            key={p.id}
            onClick={() => draft(p.id)}
            disabled={pending}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 text-left"
          >
            <span
              className="flex items-center justify-center rounded-md font-mono font-bold shrink-0"
              style={{
                width: 34,
                height: 34,
                background: ovrColor(p.currentOverall),
                color: "#0b1220",
                fontSize: 14,
              }}
            >
              {p.currentOverall}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-semibold text-white truncate">
                {p.name}
              </span>
              <span className="block text-xs text-slate-400 font-mono">
                {p.position} · {p.careerStage} · age {p.age}
              </span>
            </span>
            {pending && pickingId === p.id ? (
              <span className="text-xs text-slate-400">…</span>
            ) : (
              <ChevronRight size={16} className="text-slate-500" />
            )}
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="text-sm text-slate-500 px-1 py-4">
            No available players match.
          </div>
        )}
      </div>
    </div>
  );
}
