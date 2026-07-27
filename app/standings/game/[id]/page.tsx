import Link from "next/link";
import { notFound } from "next/navigation";
import { gameBox } from "@/lib/seasonEngine";
import TeamBadge from "@/components/TeamBadge";

export const dynamic = "force-dynamic";

interface Line {
  id: string;
  minutes: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  player: { id: string; name: string; position: string };
}

function BoxTable({
  title,
  abbr,
  color,
  score,
  lines,
}: {
  title: string;
  abbr: string;
  color: string;
  score: number;
  lines: Line[];
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <TeamBadge abbr={abbr} color={color} size={26} />
        <span className="text-white font-bold text-sm flex-1">{title}</span>
        <span className="text-white font-mono font-bold">{score}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-500 text-left">
              <th className="font-medium py-1 pr-2">Player</th>
              <th className="font-medium py-1 px-1 text-right">MIN</th>
              <th className="font-medium py-1 px-1 text-right">PTS</th>
              <th className="font-medium py-1 px-1 text-right">REB</th>
              <th className="font-medium py-1 px-1 text-right">AST</th>
              <th className="font-medium py-1 px-1 text-right">STL</th>
              <th className="font-medium py-1 px-1 text-right">BLK</th>
              <th className="font-medium py-1 px-1 text-right">TO</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {lines.map((l) => (
              <tr key={l.id} className="border-t border-white/5">
                <td className="py-1 pr-2 font-sans text-white whitespace-nowrap">
                  <Link href={`/player/${l.player.id}`} className="hover:text-[var(--gold)]">
                    {l.player.name}
                  </Link>{" "}
                  <span className="text-slate-500">{l.player.position}</span>
                </td>
                <td className="py-1 px-1 text-right text-slate-400">{l.minutes}</td>
                <td className="py-1 px-1 text-right text-white">{l.points}</td>
                <td className="py-1 px-1 text-right text-slate-300">{l.rebounds}</td>
                <td className="py-1 px-1 text-right text-slate-300">{l.assists}</td>
                <td className="py-1 px-1 text-right text-slate-300">{l.steals}</td>
                <td className="py-1 px-1 text-right text-slate-300">{l.blocks}</td>
                <td className="py-1 px-1 text-right text-slate-300">{l.turnovers}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function GameBoxPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const box = await gameBox(id);
  if (!box) notFound();

  const { game, home, away } = box;

  return (
    <div className="max-w-2xl">
      <Link href="/standings" className="text-xs text-slate-500 hover:text-white">
        ← Standings
      </Link>
      <div className="flex items-center justify-center gap-4 my-5">
        <div className="text-right">
          <div className="text-white font-bold">{game.awayTeam.abbreviation}</div>
          <div className="text-3xl font-mono font-bold text-white">
            {game.awayScore}
          </div>
        </div>
        <span className="text-slate-600 text-sm">@</span>
        <div className="text-left">
          <div className="text-white font-bold">{game.homeTeam.abbreviation}</div>
          <div className="text-3xl font-mono font-bold text-white">
            {game.homeScore}
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <BoxTable
          title={game.awayTeam.name}
          abbr={game.awayTeam.abbreviation}
          color={game.awayTeam.primaryColor}
          score={game.awayScore}
          lines={away}
        />
        <BoxTable
          title={game.homeTeam.name}
          abbr={game.homeTeam.abbreviation}
          color={game.homeTeam.primaryColor}
          score={game.homeScore}
          lines={home}
        />
      </div>
    </div>
  );
}
