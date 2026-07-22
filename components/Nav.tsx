"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield } from "lucide-react";

const LINKS = [
  { href: "/draft", label: "Draft" },
  { href: "/roster", label: "Roster" },
  { href: "/standings", label: "Standings" },
  { href: "/trades", label: "Trades" },
  { href: "/history", label: "Franchise History" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <header className="border-b border-[var(--panel-border)] sticky top-0 z-20 bg-[var(--background)]/95 backdrop-blur">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span
            className="flex items-center justify-center rounded-md"
            style={{ width: 30, height: 30, background: "var(--wiz-red)" }}
          >
            <Shield size={18} color="#fff" />
          </span>
          <span className="font-extrabold tracking-wide uppercase text-sm text-white">
            Wizards GM
          </span>
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto">
          {LINKS.map((l) => {
            const active =
              pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                  active
                    ? "bg-[var(--wiz-red)] text-white"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
