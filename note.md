# Build Notes — Wizards GM

A running journal of what got built, decisions made, and mistakes hit + how they
were fixed. Newest phase at the bottom. (README.md covers how the finished program
works; this file is the "how we got here" log.)

---

## Phase 0 — Project setup ✅

**Date:** 2026-07-22

### What I did

1. Scaffolded a Next.js app (App Router) + TypeScript + Tailwind CSS + ESLint via
   `create-next-app`.
2. Added Prisma ORM with a SQLite datasource.
3. Wrote the full `prisma/schema.prisma` covering every model from the spec:
   `Team`, `Player`, `Contract`, `Season`, `Game`, `BoxScoreLine`, `DraftPick`,
   `Trade`, `Award`.
4. Ran the initial migration (`init`) — created `prisma/dev.db`... (see mistake #2).
5. Built the layout shell: top nav (`components/Nav.tsx`) linking
   Draft / Roster / Standings / Trades / Franchise History, dark theme in
   `app/globals.css`, a franchise-overview home page, and placeholder pages for
   each section.
6. Added `lib/prisma.ts` — a server-only Prisma client singleton.
7. Copied the original `wizards-gm.jsx` into `reference/` so the real-player data
   (TEAMS / CURATED / CURATED_2) carries over for Phase 1 seeding.
8. Verified: `npm run build` passes (all 9 routes compile + type-check) and the
   dev server serves `/`, `/draft`, `/standings` with HTTP 200 and correct content.

### Decisions worth knowing

- **Folder name has a space** (`H:\claude project`). `create-next-app` rejects a
  space in the package name, so I scaffolded into a temp folder with a valid name
  and moved the files into `H:\claude project`, making the repo root == the app.
  Package name in `package.json` set to `wizards-gm`.
- **Prisma 7 + new client generator.** The generated client outputs to
  `app/generated/prisma/` (gitignored) instead of `node_modules`. Added a
  `postinstall: prisma generate` script so a fresh clone regenerates it.
- **String fields instead of enums.** SQLite doesn't support native enums, so
  `conference`, `position`, `careerStage`, trade `status`, and award `type` are
  documented `String` fields. This also keeps the schema clean when we port to
  Postgres later.
- **Contract links Player ↔ Team.** A player's current team is derived from their
  `Contract` (one active contract per player, enforced with `@unique` on
  `playerId`). Free agents / the draft pool simply have no contract. Matches the
  spec's "expiring contracts re-enter the draft pool" model.
- **Team self-relations named.** `Game` (home/away), `Trade` (initiating/other),
  and `DraftPick` (team/originalOwner) each reference `Team` twice, so those
  relations are explicitly named in the schema.

### Mistakes I made (and the fix)

1. **`new PrismaClient()` with no args failed to type-check.**
   `Type error: Expected 1 arguments, but got 0.` Prisma 7 makes **driver
   adapters mandatory** — the client constructor now requires an `adapter`.
   → Installed `@prisma/adapter-better-sqlite3` + `better-sqlite3` and passed
   `new PrismaClient({ adapter })`.

2. **Wrong export name for the adapter.**
   First tried `import { PrismaBetterSQLite3 }` → the real export is
   `PrismaBetterSqlite3` (lowercase `sqlite`). Fixed the import.

3. **`--skip-git` was ignored by create-next-app** — it still ran `git init` in
   the temp folder. Not harmful: I deleted that `.git` during the move and will
   initialize a clean repo at the project root (pending your approval, per your
   request to confirm before any git add/commit/push).

### Notes / gotchas for later

- The SQLite file path: the better-sqlite3 adapter strips the `file:` prefix from
  `DATABASE_URL` and opens the path relative to `process.cwd()` (the project
  root). `DATABASE_URL="file:./dev.db"` therefore resolves to the same `dev.db`
  the migration created at the project root. Keep them consistent.
- `lib/prisma.ts` is **server-only** — never import it into a client component.
- The preview/browser tooling in this session is scoped to a different project
  root, so verification here is done via `npm run build` + `curl` against the dev
  server rather than the preview tool.

### Not done yet (intentionally)

- No seeding — that's Phase 1.

---

## Phase 1 — Data model & seeding ✅

**Date:** 2026-07-22

### What I did

1. Transcribed the real data **verbatim** from `reference/wizards-gm.jsx` into a
   typed module `lib/data/nba.ts`: `TEAMS` (30 real teams w/ conferences + brand
   colors), `CURATED` + `CURATED_2` (the curated real-player rows), plus
   `POSITIONS`, `WIZ`, `BASE_SEASON`, `ROSTER_SIZE`, `TOTAL_PLAYERS`.
2. Added `buildPool()` — replicates the artifact's pool logic exactly: concat the
   two arrays, de-dupe by lowercased name (keeps the first), slice to 450.
3. Added `derivePlayer()` / `derivedPool()` — derives an approximate age, career
   stage, and potential per player from the source tag, using a **seeded PRNG
   (mulberry32)** so the derivation is reproducible across seed runs.
4. Wrote `prisma/seed.ts` — idempotent (wipes all tables in dependency order,
   then inserts). Seeds 30 teams (WAS flagged `isUserControlled`) and 450 players
   as free agents (no contracts yet — those come in Phase 3). Verifies counts and
   warns if the pool is short of 450.
5. Wired `npm run db:seed` → `tsx prisma/seed.ts` (added `tsx` as a dev dep).
6. Made the home page a **server component** that reads live counts + the top-8
   rated players straight from the DB, proving the runtime Prisma client + driver
   adapter works inside Next (not just in the standalone seed script).
7. Verified: seed output = 30 teams / 450 players (legend 57, prime 63, veteran
   207, rookie 123); homepage renders "30 teams, 450 real players, Michael Jordan
   99" over HTTP 200; `npm run build` passes with `/` now server-rendered.

### Decisions worth knowing

- **Exactly 450 unique players** after de-dupe — perfect, since 30 teams × 15 =
  450 fills every roster in the Phase 2 draft with zero leftovers. (One duplicate
  name, "Isaiah Thomas", exists in both arrays — the legend PG 90 is kept, the
  modern 85 is dropped, matching the original artifact.)
- **Career-stage derivation is heuristic.** The source only tags Legend / Star /
  Veteran, so: Legend → `legend` (age 34–40, no growth); Star → `prime` (25–29,
  small upside); Veteran splits by rating — `rookie` if OVR ≤ 76 (age 20–23, real
  upside, to stand in for recent draftees) else `veteran` (age 30–36). This is the
  spec's "approximate age/career stage," and it front-loads sensible potential for
  the Phase 7 development curve.
- **Players seeded as free agents.** Team membership comes from `Contract`, which
  the draft (Phase 2) + cap (Phase 3) create. Phase 1 only needs the pool to exist.
- **`force-dynamic` on the home page** so it always reflects current DB state
  rather than being frozen at build time.

### Mistakes / gotchas

- None blocking this phase. Watched for `tsx` not resolving the `@/` path alias,
  so `seed.ts` imports the generated client and data module by **relative path**
  and calls `import "dotenv/config"` itself to load `DATABASE_URL`.

### Not done yet (intentionally)

- No draft yet (Phase 2).

---

## Phase 2 — Initial snake draft ✅

**Date:** 2026-07-22

### What I did

1. `lib/draft.ts` — ported the artifact's math: `shuffle`, `buildSnakeOrder`
   (forward/reverse per round), `weightedPickFromTop` (best-available-with-
   randomness among the top 6).
2. `lib/cap.ts` — `salaryFor(overall, age)` (salary scales with overall², reduced
   for rookies/aging vets; $1.5M floor, $55M ceiling), `randomContractYears` (1–4,
   same weighting as the artifact), `formatSalary`. Shared with Phase 3.
3. `lib/draftEngine.ts` — **pure DB logic** (no `revalidatePath`): create the
   snake order as 450 `DraftPick` slots, pick weighted-best for a slot (creating
   the player's `Contract` atomically in a transaction), and a CPU loop that
   advances until Washington is on the clock or the draft ends.
4. `app/draft/actions.ts` — thin `"use server"` wrappers: `startDraft`,
   `userDraft(playerId)`, `resetDraft`, each calling the engine + revalidating.
5. `app/draft/DraftBoard.tsx` — client board with search + position filter and a
   `useTransition` pick button that calls the `userDraft` server action.
6. `app/draft/page.tsx` — server component that reads live draft state: start
   screen, on-the-clock header + progress bar, the board when it's WAS's turn,
   the Wizards roster + recent-picks sidebar, and a "draft complete" state.
7. `scripts/test-draft.ts` (`npm run test:draft`) — integration test that runs a
   FULL draft against the DB and asserts the invariants, then resets.

### How the draft flow works (important design choice)

- **All 450 picks are pre-created** as `DraftPick` rows in snake order when the
  draft starts. "On the clock" = the lowest-`pickNumber` slot with no player yet.
- **The server auto-runs every CPU pick.** After the user picks (and on start),
  the action drives CPU picks until Washington is next or the draft is done. So
  the persisted state *always* has WAS on the clock (or is complete) — meaning a
  **page refresh resumes exactly where you left off**, with zero client-side sim.
  This satisfies the spec's "results can't be gamed or lost on refresh."
- Each pick creates a real `Contract` (salary from `salaryFor`, 1–4 yr length) in
  the same transaction as filling the slot.

### Verification

- `npm run test:draft` → all 9 checks pass: 450 slots filled, 0 open, 450
  contracts, every team exactly 15, no player drafted twice, salaries within
  [$1.5M, $51.6M] observed, contract lengths 1–4.
- `npm run build` clean; `/draft` renders the Start screen; after driving the
  engine to WAS's turn, `/draft` renders the board (Your Pick, search, available
  players like LeBron, roster + recent-picks sidebar).

### Mistakes / gotchas

- **`revalidatePath` can't run outside a request**, so I split the DB logic into
  `lib/draftEngine.ts` (testable) and kept `revalidatePath` only in the
  `"use server"` actions. Cleaner and lets the integration test drive the engine.
- **tsx + node_modules resolution:** a throwaway script placed in the system temp
  dir failed to resolve `dotenv`/deps (no `node_modules` there). Test/util scripts
  must live **inside the project** (`scripts/`). tsx *does* resolve the `@/` path
  alias from the project tsconfig, which is why the engine imports work.

### Not done yet (intentionally)

- Roster/cap page + lineup management is Phase 3.

---

## Phase 3 — Roster, cap & lineup management ✅

**Date:** 2026-07-22

### What I did

1. **Schema:** added `Contract.isStarter Boolean @default(false)` and migrated
   (`add_contract_isstarter`). A team's starting five = its 5 contracts with
   `isStarter = true`.
2. `lib/cap.ts` (extended): `capSummary(total)` → `{ total, space, overCap,
   overTax }` (pure), plus a `STARTERS = 5` constant. (`SALARY_CAP` $140M and
   `LUXURY_TAX_LINE` $170M were already defined in Phase 2.)
3. `lib/rosterEngine.ts`: `autoAssignStartersForAll()` (marks each team's top-5
   by overall as starters if none are set — idempotent), `payrollByTeam()`
   (Prisma `groupBy` sum of salaries), and `setStarter(contractId, makeStarter)`
   which enforces at most 5 starters and returns a status string.
4. **Draft hook:** `app/draft/actions.ts` now calls `autoAssignStartersForAll()`
   once the draft has no open slots, so every roster gets a default lineup the
   moment the draft finishes.
5. `app/roster/actions.ts`: `toggleStarter` server action, guarded so **only
   Washington's** lineup is editable.
6. `app/roster/page.tsx`: server component driven by `?team=ABBR` (default WAS).
   Team-badge selector for all 30 teams, selected roster split into Starters
   (5) / Bench (10), a cap sheet (payroll, space, Over-cap / Luxury-tax / Under-
   cap badge), and a league-wide payroll table with over-cap flags. Washington's
   rows get Start/Bench toggle buttons (bound server action); the button to
   promote is disabled once 5 starters are set. Other teams are read-only.
7. `components/TeamBadge.tsx` extracted for reuse.

### Verification

- `npm run build` clean (`/roster` dynamic).
- Drove a full draft + `autoAssignStartersForAll()`: WAS = 5 starters / 15
  roster, payroll **$140.9M**, league total starters **150** (30×5).
- Rendered `/roster`: WAS shows the **Over cap** badge (140.9M > 140M), the
  League Payroll table, 5 Bench + 10 Start buttons. `/roster?team=BOS` is
  read-only (0 toggle buttons) — confirms the WAS-only guard.
- Starter-limit logic checked directly: promoting a 6th → `starters-full`
  (rejected); demote then promote → `ok`; count stays 5.

### Decisions worth knowing

- **Lineup = pick any 5** (no positional constraints) — simplest picker that
  satisfies "starters vs bench." Starters are ordered PG→C for display only.
- **Team selection is URL-driven** (`?team=ABBR`) so the page stays server-
  rendered and shareable — no client state needed for browsing 30 rosters.
- **CPU lineups are auto-set** to top-5 overall; only Washington's is editable,
  matching "you run Washington."
- Reminder learned again: after a schema change, **`prisma generate` must run**
  before the app type-checks. `migrate dev` usually does it, but the generated
  client lagged once here — a manual `npx prisma generate` fixed the build.

### Not done yet (intentionally)

- Season simulation with box scores is Phase 4.

---

## Phase 4 — Season simulation with real box scores ✅

**Date:** 2026-07-26

### What I did

1. `lib/sim.ts` — **pure** game math (no DB): `teamRating` (top-9 weighted),
   `rotation` (9-man, starters first), `distributeInteger` (largest-remainder
   integer allocation that sums exactly), and `simulateGame` → per-team scores
   plus a full `StatLine` per rotation player (min/pts/reb/ast/stl/blk/to).
   Scores come from each team's rating vs. the opponent + home edge + noise;
   team stat totals are distributed to players by overall, minutes, and
   position weights (bigs rebound/block, guards assist/steal, etc.).
2. `lib/seasonEngine.ts` — `simulateRegularSeason` (double round-robin = every
   team hosts every other once → 870 games; clears prior regular-season games
   first, generates explicit `randomUUID` ids so `Game` + `BoxScoreLine` rows
   insert via chunked `createMany` with no per-row round-trips), plus read
   helpers `standingsForSeason`, `wizardsGames`, `gameBox`, `hasGames`,
   `isDraftComplete`.
3. `app/standings/actions.ts` — `simulateSeason` server action (guards on a
   complete draft).
4. `app/standings/page.tsx` — start/simulate screen → after sim shows
   Washington's record and full schedule; each game links to its box score.
   A Re-simulate control re-runs it.
5. `app/standings/game/[id]/page.tsx` — the box-score view: away + home stat
   tables sorted by points, with the final score.
6. `resetDraft` now also clears games + box scores so a reset is a true wipe.
7. `scripts/test-sim.ts` (`npm run test:sim`).

### Verification

- `npm run test:sim`: **870 games / 15,660 box lines in ~2.1s**, all 7 checks
  pass — box points sum exactly to each team's score in every game, minutes sum
  to 240 per team per game, no negative stats, no ties, standings balance
  870W/870L, Washington plays 58 games (went 30-28).
- UI: `/standings` shows the WAS record + schedule; a game page renders 9
  players per team with real stat lines (verified 18 box lines / game, e.g. a
  120–97 result). `npm run build` clean (`/standings/game/[id]` dynamic).

### Decisions worth knowing

- **Full league box scores are stored** (~15.7k rows/season), not just Wizards
  games — Phase 6 awards (MVP/DPOY/etc.) need league-wide player stats.
- **Explicit UUID ids** for `Game`/`BoxScoreLine` so we can bulk-insert both
  tables with `createMany` (SQLite `createMany` can't return ids). ~2s total.
- Double round-robin (870 games), not a literal 82-game schedule — the spec
  allows this and it keeps every matchup home-and-away.
- Sim math is heuristic/approximate by design; the invariant that matters
  (points reconcile to the score) is enforced by `distributeInteger` + tested.

### Not done yet (intentionally)

- Conference standings tables + best-of-7 playoffs are Phase 5.

---

## Phase 5 — Standings & playoffs ✅

**Date:** 2026-07-26

### What I did

1. **Schema:** added to `Season`: `championTeamId` (→ Team), `finalsMvpId`
   (→ Player), and `bracket` (JSON snapshot). Migrated
   (`playoffs_champion_bracket`). Back-relations `Team.championships` /
   `Player.finalsMvpOf`.
2. **Refactor:** extracted `loadSimRosters()` in `seasonEngine.ts` (used by both
   the season and playoff engines).
3. `lib/playoffEngine.ts` — seeds top 8 per conference by win% (tiebreak wins),
   runs best-of-7 series with the **same** `simulateGame` engine (2-2-1-1-1 home
   court to the higher seed), through Round 1 → Semis → Conf Finals → NBA Finals.
   Every playoff game is stored (`isPlayoff: true`, round `R1/R2/CONF/FINALS`)
   with full box scores. Computes **Finals MVP** = the champion's best composite
   performer (pts + ½reb + ½ast + stl + blk) across the Finals games. Persists
   champion, Finals MVP, the bracket JSON, and marks the season complete.
4. `app/standings/actions.ts` — added `runPostseason`; `simulateSeason` now
   clears any prior champion/bracket (re-simming the regular season invalidates
   the playoffs).
5. `app/standings/page.tsx` — rebuilt: conference standings tables (top-8
   highlighted, Wizards row tinted), a champion banner (team + Finals MVP), the
   full bracket (both conferences + Finals) with series scores and winners
   bolded, a Run/Re-run Playoffs button, and the Wizards schedule.
6. `scripts/test-playoffs.ts` (`npm run test:playoffs`).

### Verification

- `npm run test:playoffs`: **88 playoff games in ~0.6s**, all 10 checks pass —
  all 15 series are valid best-of-7 (winner has exactly 4), conference champs
  come from the correct conference, the Finals is the two conf champs, champion
  == Finals winner and is persisted, season marked complete, Finals MVP is on
  the champion's roster, playoff games flagged and their box points reconcile.
- UI: `/standings` shows conference tables, the champion banner (e.g. **Dallas
  Mavericks** champion + Finals MVP), and the bracket (Round 1 → Semis → Conf
  Finals → NBA Finals). `npm run build` clean. DB reset to fresh afterward.

### Decisions worth knowing

- **Bracket stored as JSON on `Season`** rather than reconstructed from game
  rows — makes the bracket UI trivial and unambiguous, while the individual
  playoff `Game`/`BoxScoreLine` rows are still stored (so playoff box scores are
  viewable and the Finals MVP is computed from real stats).
- Finals home court goes to the better regular-season record.
- Re-simulating the regular season deliberately wipes the playoffs/champion,
  since seeding depends on those results.

### Not done yet (intentionally)

- League-wide awards (MVP/DPOY/ROY/6MOY/COY/All-NBA/All-Defense) are Phase 6.

---

## Phase 6 — Awards ✅

**Date:** 2026-07-27

### What I did

1. **Schema:** made `Award.playerId` nullable (COY is a team/coach award with no
   player) and added `Award.rank` (ordering within multi-player awards like
   All-NBA). Migrated (`awards_nullable_player`).
2. `lib/awardsEngine.ts` — aggregates each player's regular-season box scores
   (`groupBy playerId`), derives per-game production (`statVal`), a team-success-
   blended `mvpScore`, and a defensive `defScore`, then picks:
   - **MVP** (top mvpScore), **DPOY** (top defScore), **6MOY** (top producer who
     isn't a starter), **All-NBA 1st/2nd/3rd** (top 15 by mvpScore, 5 each),
     **All-Defensive 1st** (top 5 defScore).
   - **ROY** — best rookie by production, with a fallback to the highest-rated
     rostered rookie (see gotcha).
   - **COY** — biggest win improvement vs. the prior season for a CPU team;
     falls back to best CPU record when there's no prior season (year 1).
   - **Finals MVP** — mirrors `Season.finalsMvpId` from the playoffs.
   All persisted as `Award` rows (idempotent: clears the season's awards first).
3. Wired `computeSeasonAwards` into `runPostseason` (after the playoffs, since it
   needs the Finals MVP); `simulateSeason` clears awards too.
4. `app/standings/page.tsx` — an Awards panel: the individual awards with player
   + team badge, COY as a team, and the All-NBA / All-Defensive teams listed.
5. `scripts/test-awards.ts` (`npm run test:awards`).

### Verification

- `npm run test:awards`: all 12 checks pass — MVP/DPOY awarded, ROY is a rookie,
  6MOY is a bench player, COY is a CPU team with `playerId = null` (e.g. PHI),
  each All-NBA team + All-Defensive has exactly 5, MVP sits on the All-NBA 1st
  team, 15 distinct All-NBA players, Finals MVP matches the season.
- UI: `/standings` shows the full Awards panel. `npm run build` clean. DB reset.

### Mistakes / gotchas

- **ROY had no candidate at first.** In the all-time initial draft the low-rated
  `careerStage: "rookie"` players never crack a 9-man rotation, so none log box
  scores → `find(rookie)` returned nothing and no ROY was created. Added a
  fallback: if no rookie produced stats, award ROY to the **highest-rated
  rostered rookie**. This becomes production-based naturally in Phase 7 when real
  young rookie classes enter and some earn rotation minutes.

### Not done yet (intentionally)

- Offseason (aging, contract decrement, retirements, draft lottery, new real
  rookie class) is Phase 7.

---

## Phase 7 — Offseason: aging, contracts, lottery, rookie class ✅

**Date:** 2026-07-27

### What I did

1. `lib/data/reserve.ts` — a reserve of ~120 **real** NBA players (recent role
   players + historical greats) beyond the original 450, drawn on for rookie
   classes. Deduped by name at draw time, so overlaps with the 450 are skipped.
2. `lib/offseasonEngine.ts` — `advanceOffseason(oldSeasonId)`:
   - **Aging + development** (`developOverall`): <24 can break out (+, capped by
     potential), 24–30 stable, 31–34 gradual decline, 35+ steep decline.
     Career stage transitions rookie→prime→veteran with age.
   - **Retirements** (`shouldRetire`): probability climbs with age (35+), higher
     for low-rated players; retirees get `retiredAt` and lose their contract.
   - **Contracts** decrement; those hitting 0 (or belonging to retirees) are
     deleted → the player becomes a free agent (re-enters the pool).
   - **New rookie class** (`ROOKIE_CLASS_SIZE = 45`) from the reserve (real names
     not already in the DB), age 19 with upside potential; **only if the reserve
     is exhausted** does it fall back to `isReal: false` "Fictional Prospect N".
   - **New season** row (year+1); old season marked complete.
   - **Draft lottery**: non-playoff teams (worst-first) get weighted odds
     (`lotteryDraw`) for the top picks; playoff teams follow in reverse-standings
     order. Draft slots are created only for each team's vacancies.
   - Runs CPU picks up to Washington (reusing the Phase-2 engine); tops up
     starters if the draft auto-completes.
3. `autoAssignStartersForAll` upgraded to **top up to 5** starters (not just fill
   empty lineups) — needed when retirements/expirations leave a team short.
4. `app/standings/actions.ts` — `advanceToOffseason` server action (advances then
   redirects to `/draft`); a gold **"Advance to {year+1} →"** button appears on
   the standings page once the season is complete. The existing draft page/board
   handle the offseason vacancy draft unchanged.
5. `scripts/test-offseason.ts` (`npm run test:offseason`).

### How the multi-year loop works

Finish a season (sim → playoffs → awards) → **Advance** → players age, vets
retire, contracts expire, a real rookie class enters, the lottery sets the order
→ you draft Washington's vacancies on the same draft screen → simulate the new
season → repeat. Every past season's games, awards, and champion are retained for
franchise history (Phase 9).

### Verification

- `npm run test:offseason`: all 13 checks pass. One run: **43 retired, 45 real
  rookies (0 fictional), 86 vacancies**; every prior player aged +1; overalls
  stayed in [66,99]; no contract left at 0 years; retirees hold no contract;
  contract count didn't grow; rookie class = 45 real reserve players; draft slots
  == vacancies; **pick #1 went to a non-playoff team** (lottery); no roster over
  15; and a **second** advance reached year+2 with a fresh rookie class.
- UI: after advancing, `/draft` shows the new year's vacancy draft with real
  reserve rookies available (e.g. Scoot Henderson, Bob Pettit) and Washington on
  the clock. `npm run build` clean. DB re-seeded to a pristine single-season
  state afterward.

### Decisions worth knowing

- **Reserve dedupe by name** (no consumption counter needed) — each offseason
  simply takes the next unused real names, which naturally advances the class.
- **Vacancy-only draft**: teams draft just enough to refill to 15, in
  lottery/reverse order — so the offseason draft is short (~86 picks) vs. the
  450-pick initial one.
- Free agents (expired/undrafted) age too and remain in the pool for future
  drafts.

### Not done yet (intentionally)

- Trades (propose/evaluate/accept with cap rules) are Phase 8.
