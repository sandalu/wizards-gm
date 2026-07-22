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

- No contracts/salaries yet (Phase 3), no draft (Phase 2).
