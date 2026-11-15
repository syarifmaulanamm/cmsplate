/*
  Warnings:

  - You are about to drop the column `content` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the column `contentHtml` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the column `contentText` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the column `excerpt` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the column `publishedAt` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the column `readTime` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the column `seoScore` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `posts` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "posts_slug_key";

-- DropIndex
DROP INDEX "posts_status_publishedAt_idx";

-- AlterTable
ALTER TABLE "posts" DROP COLUMN "content",
DROP COLUMN "contentHtml",
DROP COLUMN "contentText",
DROP COLUMN "excerpt",
DROP COLUMN "publishedAt",
DROP COLUMN "readTime",
DROP COLUMN "seoScore",
DROP COLUMN "slug",
DROP COLUMN "status",
DROP COLUMN "title";

-- CreateTable
CREATE TABLE "post_translations" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL DEFAULT '',
    "content" JSONB NOT NULL DEFAULT '{}',
    "contentHtml" TEXT NOT NULL DEFAULT '',
    "contentText" TEXT NOT NULL DEFAULT '',
    "status" "PostStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "readTime" INTEGER NOT NULL DEFAULT 1,
    "seoScore" INTEGER NOT NULL DEFAULT 0,
    "focusKeyword" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "post_translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "post_translations_locale_status_publishedAt_idx" ON "post_translations"("locale", "status", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "post_translations_postId_locale_key" ON "post_translations"("postId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "post_translations_locale_slug_key" ON "post_translations"("locale", "slug");

-- AddForeignKey
ALTER TABLE "post_translations" ADD CONSTRAINT "post_translations_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
