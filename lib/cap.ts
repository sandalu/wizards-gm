// Salary-cap model. Shared by the draft (Phase 2) and roster/cap page (Phase 3).
// Approximate, sim-flavored numbers — not a real CBA.

export const SALARY_CAP = 140_000_000; // league soft cap
export const LUXURY_TAX_LINE = 170_000_000; // soft luxury-tax line above the cap
export const MIN_SALARY = 1_500_000;
export const MAX_SALARY = 55_000_000; // supermax-ish ceiling

/**
 * Salary roughly scaled to overall (dominant factor) and age.
 * Elite players cost the most; aging vets and rookies cost less.
 */
export function salaryFor(overall: number, age: number): number {
  // Normalize overall 68..99 -> 0..1, square it so stars are worth a lot more.
  const t = Math.max(0, Math.min(1, (overall - 68) / (99 - 68)));
  const base = MIN_SALARY + t * t * (MAX_SALARY - MIN_SALARY);

  let ageFactor = 1;
  if (age <= 23) ageFactor = 0.6; // rookie-scale
  else if (age <= 30) ageFactor = 1; // prime
  else if (age <= 33) ageFactor = 0.9;
  else ageFactor = 0.7; // aging vet

  const salary = base * ageFactor;
  return Math.max(MIN_SALARY, Math.round(salary / 100_000) * 100_000);
}

/** Weighted 1–4 year contract length, mirroring the original artifact. */
export function randomContractYears(): number {
  const r = Math.random();
  if (r < 0.12) return 1;
  if (r < 0.42) return 2;
  if (r < 0.76) return 3;
  return 4;
}

/** Format dollars as e.g. "$12.5M". */
export function formatSalary(dollars: number): string {
  return `$${(dollars / 1_000_000).toFixed(1)}M`;
}
