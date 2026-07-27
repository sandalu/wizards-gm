-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Award" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "seasonId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "playerId" TEXT,
    "teamId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "Award_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Award_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Award_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Award" ("id", "playerId", "seasonId", "teamId", "type") SELECT "id", "playerId", "seasonId", "teamId", "type" FROM "Award";
DROP TABLE "Award";
ALTER TABLE "new_Award" RENAME TO "Award";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
