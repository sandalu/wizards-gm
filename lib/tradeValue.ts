// Pure trade-value model. Aggregate value blends overall (dominant, convex so
// stars are worth far more), an age curve, and years of contract control.

export interface ValuedAsset {
  currentOverall: number;
  age: number;
  yearsRemaining: number;
}

export function playerTradeValue(a: ValuedAsset): number {
  const base = Math.pow(Math.max(0, a.currentOverall - 55), 1.8);
  let ageF: number;
  if (a.age <= 25) ageF = 1.15;
  else if (a.age <= 29) ageF = 1.0;
  else if (a.age <= 32) ageF = 0.9;
  else if (a.age <= 35) ageF = 0.72;
  else ageF = 0.55;
  const control = 1 + 0.03 * a.yearsRemaining;
  return base * ageF * control;
}

export function sumValue(assets: ValuedAsset[]): number {
  return assets.reduce((s, a) => s + playerTradeValue(a), 0);
}

// CPU accepts if what it receives is at least this fraction of what it gives up.
export const ACCEPT_TOLERANCE = 0.12; // within 12%
// Below this fraction the deal is too lopsided to even counter.
export const COUNTER_FLOOR = 0.55;
