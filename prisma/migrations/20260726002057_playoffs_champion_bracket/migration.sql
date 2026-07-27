-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Season" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "championTeamId" TEXT,
    "finalsMvpId" TEXT,
    "bracket" TEXT,
    CONSTRAINT "Season_championTeamId_fkey" FOREIGN KEY ("championTeamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Season_finalsMvpId_fkey" FOREIGN KEY ("finalsMvpId") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Season" ("id", "isComplete", "year") SELECT "id", "isComplete", "year" FROM "Season";
DROP TABLE "Season";
ALTER TABLE "new_Season" RENAME TO "Season";
CREATE UNIQUE INDEX "Season_year_key" ON "Season"("year");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
