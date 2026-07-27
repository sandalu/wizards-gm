"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatSalary } from "@/lib/cap";
import { submitTrade } from "./actions";
import type { TradeDecision } from "@/lib/tradeEngine";

export interface RosterItem {
  playerId: string;
  name: string;
  position: string;
  overall: number;
  age: number;
  yearsRemaining: number;
  salary: number;
}

function PlayerPick({
  p,
  checked,
  onToggle,
}: {
  p: RosterItem;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left"
      style={{
        background: checked ? "rgba(227,24,55,0.22)" : "rgba(255,255,255,0.04)",
        border: checked ? "1px solid var(--wiz-red)" : "1px solid transparent",
      }}
    >
      <span className="font-mono text-[var(--gold)] w-6 text-xs">{p.overall}</span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm text-white truncate">{p.name}</span>
        <span className="block text-[11px] text-slate-400 font-mono">
          {p.position} · age {p.age} · {p.yearsRemaining}yr · {formatSalary(p.salary)}
        </span>
      </span>
    </button>
  );
}

export default function TradeMachine({
  cpuTeamId,
  cpuAbbr,
  wasRoster,
  cpuRoster,
}: {
  cpuTeamId: string;
  cpuAbbr: string;
  wasRoster: RosterItem[];
  cpuRoster: RosterItem[];
}) {
  const [wasSel, setWasSel] = useState<Set<string>>(new Set());
  const [cpuSel, setCpuSel] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<TradeDecision | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const toggle = (set: Set<string>, id: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
  };

  const propose = (wasIds: string[], cpuIds: string[]) => {
    startTransition(async () => {
      const decision = await submitTrade(cpuTeamId, wasIds, cpuIds);
      setResult(decision);
      if (decision.status === "accepted") {
        setWasSel(new Set());
        setCpuSel(new Set());
        router.refresh();
      }
    });
  };

  const acceptCounter = () => {
    if (!result?.counter) return;
    const { wasPlayerIds, cpuPlayerIds } = result.counter;
    setWasSel(new Set(wasPlayerIds));
    setCpuSel(new Set(cpuPlayerIds));
    propose(wasPlayerIds, cpuPlayerIds);
  };

  const statusColor: Record<string, string> = {
    accepted: "#34d399",
    countered: "#fbbf24",
    rejected: "#f87171",
    invalid: "#f87171",
  };

  return (
    <div>
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-2">
            Washington sends ({wasSel.size})
          </div>
          <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
            {wasRoster.map((p) => (
              <PlayerPick
                key={p.playerId}
                p={p}
                checked={wasSel.has(p.playerId)}
                onToggle={() => toggle(wasSel, p.playerId, setWasSel)}
              />
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-2">
            {cpuAbbr} sends ({cpuSel.size})
          </div>
          <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
            {cpuRoster.map((p) => (
              <PlayerPick
                key={p.playerId}
                p={p}
                checked={cpuSel.has(p.playerId)}
                onToggle={() => toggle(cpuSel, p.playerId, setCpuSel)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={() => propose([...wasSel], [...cpuSel])}
          disabled={pending || wasSel.size === 0 || cpuSel.size === 0}
          className="px-5 py-2.5 rounded-lg text-white font-bold uppercase tracking-wider text-sm disabled:opacity-40"
          style={{ background: "var(--wiz-red)" }}
        >
          {pending ? "Evaluating…" : "Propose Trade"}
        </button>
        {(wasSel.size > 0 || cpuSel.size > 0) && (
          <button
            onClick={() => {
              setWasSel(new Set());
              setCpuSel(new Set());
              setResult(null);
            }}
            className="text-xs text-slate-500 hover:text-white underline"
          >
            Clear
          </button>
        )}
      </div>

      {result && (
        <div
          className="mt-4 rounded-xl p-4 border"
          style={{
            borderColor: statusColor[result.status] + "66",
            background: statusColor[result.status] + "14",
          }}
        >
          <div
            className="text-sm font-bold uppercase tracking-wide"
            style={{ color: statusColor[result.status] }}
          >
            {result.status}
          </div>
          <div className="text-sm text-slate-300 mt-1">{result.reason}</div>
          {(result.valueWasSends > 0 || result.valueCpuSends > 0) && (
            <div className="text-xs text-slate-500 font-mono mt-2">
              value out {Math.round(result.valueWasSends)} · value in{" "}
              {Math.round(result.valueCpuSends)}
            </div>
          )}
          {result.status === "countered" && result.counter && (
            <button
              onClick={acceptCounter}
              disabled={pending}
              className="mt-3 px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-40"
              style={{ background: "var(--wiz-red)" }}
            >
              Accept counter
            </button>
          )}
        </div>
      )}
    </div>
  );
}
