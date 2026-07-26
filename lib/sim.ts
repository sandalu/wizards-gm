// Pure game-simulation math — no DB, no randomness beyond Math.random, so it can
// be unit-tested. Produces a full per-player box score for a single game.

export interface SimPlayer {
  playerId: string;
  currentOverall: number;
  position: string; // PG SG SF PF C
  isStarter: boolean;
}

export interface StatLine {
  playerId: string;
  minutes: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
}

export interface GameResult {
  homeScore: number;
  awayScore: number;
  homeLines: StatLine[];
  awayLines: StatLine[];
}

/** Roughly-normal noise, mean 0, std ~0.7 (sum-of-uniforms). */
function gauss(): number {
  let s = 0;
  for (let i = 0; i < 6; i++) s += Math.random();
  return s - 3;
}

const REB_W: Record<string, number> = { C: 1.7, PF: 1.4, SF: 1.0, SG: 0.7, PG: 0.6 };
const AST_W: Record<string, number> = { PG: 1.9, SG: 1.1, SF: 1.0, PF: 0.7, C: 0.6 };
const STL_W: Record<string, number> = { PG: 1.3, SG: 1.2, SF: 1.05, PF: 0.85, C: 0.7 };
const BLK_W: Record<string, number> = { C: 2.2, PF: 1.3, SF: 0.7, SG: 0.4, PG: 0.3 };
const TO_W: Record<string, number> = { PG: 1.4, SG: 1.1, SF: 1.0, PF: 0.9, C: 0.8 };

/** Weighted team strength from the roster (top 9 by overall, front-loaded). */
export function teamRating(players: { currentOverall: number }[]): number {
  if (players.length === 0) return 50;
  const sorted = [...players].sort((a, b) => b.currentOverall - a.currentOverall);
  const top = sorted.slice(0, 9);
  const weights = [1.3, 1.25, 1.2, 1.1, 1.0, 0.8, 0.7, 0.6, 0.5];
  let sum = 0;
  let wsum = 0;
  top.forEach((p, i) => {
    const w = weights[i] ?? 0.4;
    sum += p.currentOverall * w;
    wsum += w;
  });
  return sum / wsum;
}

/** The 9-man rotation: starters first, then best bench. */
export function rotation(players: SimPlayer[]): SimPlayer[] {
  return [...players]
    .sort(
      (a, b) =>
        Number(b.isStarter) - Number(a.isStarter) ||
        b.currentOverall - a.currentOverall,
    )
    .slice(0, 9);
}

/** Integer allocation of `total` across `weights`, summing exactly to `total`. */
export function distributeInteger(total: number, weights: number[]): number[] {
  const n = weights.length;
  if (n === 0) return [];
  const t = Math.max(0, Math.round(total));
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  const raw = weights.map((w) => (t * w) / sum);
  const out = raw.map(Math.floor);
  let rem = t - out.reduce((a, b) => a + b, 0);
  const byFrac = raw
    .map((r, i) => ({ frac: r - Math.floor(r), i }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; rem > 0 && k < n; k++, rem--) out[byFrac[k].i]++;
  return out;
}

function expectedScore(ratingSelf: number, ratingOpp: number, home: boolean) {
  const pts =
    108 + (ratingSelf - ratingOpp) * 0.9 + (home ? 2 : 0) + gauss() * 8;
  return Math.max(85, Math.round(pts));
}

/** Build one team's box score from its rotation and team stat totals. */
function buildLines(
  rot: SimPlayer[],
  points: number,
): StatLine[] {
  const minutesW = rot.map(
    (p) => (p.isStarter ? 34 : 16) + (p.currentOverall - 75) * 0.3,
  );
  const minutes = distributeInteger(240, minutesW); // 5 players * 48 min

  const scoringW = rot.map(
    (p, i) =>
      Math.pow(p.currentOverall, 1.6) *
      (minutes[i] / 30) *
      (0.85 + Math.random() * 0.3),
  );
  const pts = distributeInteger(points, scoringW);

  const rebTotal = Math.max(30, Math.round(44 + gauss() * 4));
  const astTotal = Math.max(15, Math.round(25 + gauss() * 3));
  const stlTotal = Math.max(3, Math.round(7 + gauss() * 1.5));
  const blkTotal = Math.max(1, Math.round(5 + gauss() * 1.5));
  const toTotal = Math.max(6, Math.round(14 + gauss() * 2));

  const posW = (map: Record<string, number>) =>
    rot.map((p, i) => (map[p.position] ?? 1) * (minutes[i] / 30) * (0.7 + Math.random() * 0.6));

  const reb = distributeInteger(rebTotal, posW(REB_W));
  const ast = distributeInteger(astTotal, posW(AST_W));
  const stl = distributeInteger(stlTotal, posW(STL_W));
  const blk = distributeInteger(blkTotal, posW(BLK_W));
  const to = distributeInteger(toTotal, posW(TO_W));

  return rot.map((p, i) => ({
    playerId: p.playerId,
    minutes: minutes[i],
    points: pts[i],
    rebounds: reb[i],
    assists: ast[i],
    steals: stl[i],
    blocks: blk[i],
    turnovers: to[i],
  }));
}

/** Simulate a single game between two rosters. */
export function simulateGame(
  homePlayers: SimPlayer[],
  awayPlayers: SimPlayer[],
): GameResult {
  const rH = teamRating(homePlayers);
  const rA = teamRating(awayPlayers);

  let homeScore = expectedScore(rH, rA, true);
  let awayScore = expectedScore(rA, rH, false);
  if (homeScore === awayScore) homeScore += 1; // no ties in basketball

  return {
    homeScore,
    awayScore,
    homeLines: buildLines(rotation(homePlayers), homeScore),
    awayLines: buildLines(rotation(awayPlayers), awayScore),
  };
}
