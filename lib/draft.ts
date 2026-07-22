// Draft math — ported verbatim in spirit from the original artifact.

/** Fisher–Yates shuffle (returns a new array). */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Snake order: round 0 forwards, round 1 reversed, etc. */
export function buildSnakeOrder<T>(teamIds: T[], rounds: number): T[] {
  const order: T[] = [];
  for (let r = 0; r < rounds; r++) {
    order.push(...(r % 2 === 0 ? teamIds : [...teamIds].reverse()));
  }
  return order;
}

/**
 * Weighted "best available with randomness": among the top-n candidates,
 * higher-ranked players are proportionally more likely, but not guaranteed.
 */
export function weightedPickFromTop<T>(list: T[], n = 6): T {
  const top = list.slice(0, n);
  const weights = top.map((_, idx) => top.length - idx);
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < top.length; i++) {
    r -= weights[i];
    if (r <= 0) return top[i];
  }
  return top[top.length - 1];
}
