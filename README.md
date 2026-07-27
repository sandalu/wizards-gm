# Wizards GM — NBA Franchise Simulator

A full-stack, persistent NBA franchise management sim. **You own the Washington
Wizards**; the app controls the other 29 teams. You draft, manage the roster and
salary cap, simulate seasons, and make trades across many in-game years — with
everything saved to a real database, so the franchise survives closing the
browser.

> **Hard rule:** every player is a **real** NBA player. Never a fictional/generated
> name. (The only exception is if the historical reserve pool is ever fully
> exhausted in a future season, in which case procedurally-generated prospects are
> clearly labelled "Fictional Prospect" — see Phase 7.)

---

## Tech stack

| Layer      | Choice                                             |
| ---------- | -------------------------------------------------- |
| Framework  | Next.js (App Router) + TypeScript                  |
| Styling    | Tailwind CSS v4                                     |
| Database   | Prisma ORM + SQLite (local dev; portable to Postgres) |
| DB driver  | `@prisma/adapter-better-sqlite3` (Prisma 7 adapter) |
| Charts     | Recharts (standings / win-trend visuals)           |
| Icons      | lucide-react                                       |

All state-mutating logic (draft picks, season sim, trades, offseason) runs on the
**server** via server actions / API routes — never in the client — so results
can't be gamed or lost on refresh.

---

## Getting started

```bash
# 1. Install dependencies (also runs `prisma generate` via postinstall)
npm install

# 2. Create / migrate the local SQLite database
npm run db:migrate

# 3. (later phases) Seed the 30 teams + ~450 real players
npm run db:seed

# 4. Run the dev server
npm run dev
```

Then open <http://localhost:3000>.

### Useful scripts

| Command             | What it does                                        |
| ------------------- | --------------------------------------------------- |
| `npm run dev`       | Start the Next.js dev server on port 3000           |
| `npm run build`     | Production build + full type-check                  |
| `npm run db:migrate`| Apply Prisma migrations to the local SQLite db      |
| `npm run db:reset`  | Drop + recreate the database (destructive)          |
| `npm run db:studio` | Open Prisma Studio to browse the data               |
| `npm run db:seed`   | Seed teams + players (wired up in Phase 1)          |

---

## How it works (architecture)

- **Database** — `prisma/schema.prisma` defines every model (`Team`, `Player`,
  `Contract`, `Season`, `Game`, `BoxScoreLine`, `DraftPick`, `Trade`, `Award`).
  SQLite lives at `prisma/dev.db` (gitignored). The generated Prisma client lands
  in `app/generated/prisma/` (also gitignored; regenerated on `npm install`).
- **Server-only DB access** — `lib/prisma.ts` exports a single shared
  `PrismaClient` (with the better-sqlite3 driver adapter). Import it only in
  server code (server components, server actions, API routes) — never in a client
  component.
- **UI shell** — `app/layout.tsx` renders the top nav (`components/Nav.tsx`) with
  the five sections: **Draft / Roster / Standings / Trades / Franchise History**.
  Each has a route under `app/<section>/page.tsx`.
- **Real-player data** — the original `wizards-gm.jsx` artifact (30 teams +
  ~450 curated real players) is kept in `reference/wizards-gm.jsx`; the seed
  script draws from its `TEAMS`, `CURATED`, and `CURATED_2` arrays.

---

## Build phases

The app is built in verifiable phases. Each is runnable before the next begins.

- [x] **Phase 0** — Project setup: scaffold, Prisma schema + initial migration, nav shell
- [x] **Phase 1** — Data model & seeding (30 teams + ~450 real players)
- [x] **Phase 2** — Initial snake draft (15 rounds, persisted)
- [x] **Phase 3** — Roster, salary cap & lineup management
- [x] **Phase 4** — Season simulation with real per-player box scores
- [x] **Phase 5** — Standings & best-of-7 playoffs
- [x] **Phase 6** — Awards (MVP, DPOY, ROY, 6MOY, COY, All-NBA, Finals MVP)
- [x] **Phase 7** — Offseason: aging, contracts, draft lottery, new draft class
- [x] **Phase 8** — Trades (CPU value evaluation + cap rules)
- [x] **Phase 9** — Franchise history & polish (charts, player detail pages)

See `note.md` for a running log of what was built, decisions made, and problems
hit along the way.

---

## Project layout

```
app/
  layout.tsx          Root layout + nav
  page.tsx            Franchise home / overview
  draft/              Draft board          (Phase 2)
  roster/             Roster & cap         (Phase 3)
  standings/          Standings & playoffs (Phases 4–5)
  trades/             Trade machine        (Phase 8)
  history/            Franchise history    (Phase 9)
  generated/prisma/   Generated Prisma client (gitignored)
components/           Shared React components (Nav, etc.)
lib/prisma.ts         Server-only Prisma singleton
prisma/
  schema.prisma       Full data model
  migrations/         SQL migration history
  dev.db              Local SQLite database (gitignored)
reference/
  wizards-gm.jsx      Original artifact — source of real-player data
```
