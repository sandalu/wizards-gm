export default function TeamBadge({
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
