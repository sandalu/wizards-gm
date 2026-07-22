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

- No git repo initialized / no commit — waiting for your go-ahead.
- No seeding — that's Phase 1.
