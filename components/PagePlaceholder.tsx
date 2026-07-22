export default function PagePlaceholder({
  title,
  phase,
  children,
}: {
  title: string;
  phase: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <h1 className="text-xl font-extrabold uppercase tracking-wide text-white">
          {title}
        </h1>
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 border border-[var(--panel-border)] rounded px-2 py-0.5">
          {phase}
        </span>
      </div>
      <div className="rounded-xl p-5 border border-[var(--panel-border)] bg-[var(--panel)] text-slate-400 text-sm leading-relaxed">
        {children}
      </div>
    </div>
  );
}
