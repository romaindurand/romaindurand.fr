-- CreateTable
CREATE TABLE "FailedLogin" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Post" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "chapo" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL DEFAULT '',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "slug" TEXT
);
INSERT INTO "new_Post" ("content", "createdAt", "id", "published", "slug", "title", "updatedAt") SELECT coalesce("content", '') AS "content", "createdAt", "id", "published", "slug", "title", "updatedAt" FROM "Post";
DROP TABLE "Post";
ALTER TABLE "new_Post" RENAME TO "Post";
CREATE UNIQUE INDEX "Post_slug_key" ON "Post"("slug");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
