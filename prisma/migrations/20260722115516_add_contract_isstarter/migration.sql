-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Contract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "yearsRemaining" INTEGER NOT NULL,
    "annualSalary" INTEGER NOT NULL,
    "signedSeason" INTEGER NOT NULL,
    "isStarter" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Contract_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Contract_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Contract" ("annualSalary", "id", "playerId", "signedSeason", "teamId", "yearsRemaining") SELECT "annualSalary", "id", "playerId", "signedSeason", "teamId", "yearsRemaining" FROM "Contract";
DROP TABLE "Contract";
ALTER TABLE "new_Contract" RENAME TO "Contract";
CREATE UNIQUE INDEX "Contract_playerId_key" ON "Contract"("playerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
