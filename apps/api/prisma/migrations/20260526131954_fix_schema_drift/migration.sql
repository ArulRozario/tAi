/*
  Warnings:

  - The values [GENRE] on the enum `ChatContext` will be removed. If these variants are still used in the database, this will fail.
  - The values [ESCALATED,ERROR] on the enum `PageStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [SENTENCE] on the enum `SegmentUnit` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `sentenceId` on the `Error` table. All the data in the column will be lost.
  - You are about to drop the column `originalText` on the `Page` table. All the data in the column will be lost.
  - You are about to drop the column `sourceMarkdown` on the `Page` table. All the data in the column will be lost.
  - You are about to drop the column `translationModel` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `sentenceId` on the `TranslationMemory` table. All the data in the column will be lost.
  - You are about to drop the `Sentence` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[approvedSubmissionId]` on the table `Page` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `pageId` to the `Error` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ReviewSubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
BEGIN;
CREATE TYPE "ChatContext_new" AS ENUM ('STYLE_GUIDE', 'REVIEW', 'GLOSSARY', 'GENERAL');
ALTER TABLE "ChatSession" ALTER COLUMN "context" DROP DEFAULT;
ALTER TABLE "ChatSession" ALTER COLUMN "context" TYPE "ChatContext_new" USING ("context"::text::"ChatContext_new");
ALTER TYPE "ChatContext" RENAME TO "ChatContext_old";
ALTER TYPE "ChatContext_new" RENAME TO "ChatContext";
DROP TYPE "ChatContext_old";
ALTER TABLE "ChatSession" ALTER COLUMN "context" SET DEFAULT 'GENERAL';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PageStatus_new" AS ENUM ('PENDING', 'RENDERING', 'READY', 'TRANSLATING', 'TRANSLATED', 'REVIEWING', 'HUMAN_REVIEW', 'APPROVED', 'REJECTED', 'RENDER_ERROR', 'TRANSLATION_ERROR');
ALTER TABLE "Page" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Page" ALTER COLUMN "status" TYPE "PageStatus_new" USING ("status"::text::"PageStatus_new");
ALTER TYPE "PageStatus" RENAME TO "PageStatus_old";
ALTER TYPE "PageStatus_new" RENAME TO "PageStatus";
DROP TYPE "PageStatus_old";
ALTER TABLE "Page" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
ALTER TYPE "Provider" ADD VALUE 'GOOGLE';

-- AlterEnum
BEGIN;
CREATE TYPE "SegmentUnit_new" AS ENUM ('VERSE', 'PARAGRAPH', 'PAGE');
ALTER TABLE "StyleGuide" ALTER COLUMN "segmentUnit" DROP DEFAULT;
ALTER TABLE "StyleGuide" ALTER COLUMN "segmentUnit" TYPE "SegmentUnit_new" USING ("segmentUnit"::text::"SegmentUnit_new");
ALTER TYPE "SegmentUnit" RENAME TO "SegmentUnit_old";
ALTER TYPE "SegmentUnit_new" RENAME TO "SegmentUnit";
DROP TYPE "SegmentUnit_old";
ALTER TABLE "StyleGuide" ALTER COLUMN "segmentUnit" SET DEFAULT 'PAGE';
COMMIT;

-- DropForeignKey
ALTER TABLE "Error" DROP CONSTRAINT "Error_sentenceId_fkey";

-- DropForeignKey
ALTER TABLE "Sentence" DROP CONSTRAINT "Sentence_assignedReviewerId_fkey";

-- DropForeignKey
ALTER TABLE "Sentence" DROP CONSTRAINT "Sentence_pageId_fkey";

-- DropForeignKey
ALTER TABLE "TranslationMemory" DROP CONSTRAINT "TranslationMemory_sentenceId_fkey";

-- DropIndex
DROP INDEX "TranslationMemory_sentenceId_key";

-- AlterTable
ALTER TABLE "Error" DROP COLUMN "sentenceId",
ADD COLUMN     "pageId" TEXT NOT NULL,
ADD COLUMN     "segmentId" TEXT;

-- AlterTable
ALTER TABLE "Page" DROP COLUMN "originalText",
DROP COLUMN "sourceMarkdown",
ADD COLUMN     "approvedSubmissionId" TEXT,
ADD COLUMN     "originalHtml" TEXT,
ADD COLUMN     "reviewModel" TEXT,
ADD COLUMN     "submittedAt" TIMESTAMP(3),
ADD COLUMN     "submittedById" TEXT,
ADD COLUMN     "translatedHtml" TEXT,
ADD COLUMN     "translationMetadata" JSONB,
ADD COLUMN     "translationModel" TEXT;

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "translationModel";

-- AlterTable
ALTER TABLE "StyleGuide" RENAME CONSTRAINT "Genre_pkey" TO "StyleGuide_pkey";
ALTER TABLE "StyleGuide" ALTER COLUMN "segmentUnit" SET DEFAULT 'PAGE';

-- AlterTable
ALTER TABLE "StyleGuideVersion" RENAME CONSTRAINT "GenreVersion_pkey" TO "StyleGuideVersion_pkey";

-- AlterTable
ALTER TABLE "TranslationMemory" DROP COLUMN "sentenceId",
ADD COLUMN     "pageId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT true;

-- DropTable
DROP TABLE "Sentence";

-- DropEnum
DROP TYPE "SentenceStatus";

-- CreateTable
CREATE TABLE "PageEdit" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "editedText" TEXT NOT NULL,
    "editedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageEdit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageReviewSubmission" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "status" "ReviewSubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedById" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageReviewSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageReviewSubmissionItem" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "editedText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageReviewSubmissionItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PageEdit_pageId_segmentId_key" ON "PageEdit"("pageId", "segmentId");

-- CreateIndex
CREATE INDEX "PageReviewSubmission_pageId_status_idx" ON "PageReviewSubmission"("pageId", "status");

-- CreateIndex
CREATE INDEX "PageReviewSubmission_submittedById_idx" ON "PageReviewSubmission"("submittedById");

-- CreateIndex
CREATE INDEX "PageReviewSubmissionItem_submissionId_idx" ON "PageReviewSubmissionItem"("submissionId");

-- CreateIndex
CREATE INDEX "PageReviewSubmissionItem_segmentId_idx" ON "PageReviewSubmissionItem"("segmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Page_approvedSubmissionId_key" ON "Page"("approvedSubmissionId");

-- RenameForeignKey
ALTER TABLE "GlossaryTerm" RENAME CONSTRAINT "GlossaryTerm_genreId_fkey" TO "GlossaryTerm_styleGuideId_fkey";

-- RenameForeignKey
ALTER TABLE "Project" RENAME CONSTRAINT "Project_genreId_fkey" TO "Project_styleGuideId_fkey";

-- RenameForeignKey
ALTER TABLE "StyleGuide" RENAME CONSTRAINT "Genre_createdById_fkey" TO "StyleGuide_createdById_fkey";

-- RenameForeignKey
ALTER TABLE "StyleGuide" RENAME CONSTRAINT "Genre_currentVersionId_fkey" TO "StyleGuide_currentVersionId_fkey";

-- RenameForeignKey
ALTER TABLE "StyleGuideVersion" RENAME CONSTRAINT "GenreVersion_createdById_fkey" TO "StyleGuideVersion_createdById_fkey";

-- RenameForeignKey
ALTER TABLE "StyleGuideVersion" RENAME CONSTRAINT "GenreVersion_genreId_fkey" TO "StyleGuideVersion_styleGuideId_fkey";

-- RenameForeignKey
ALTER TABLE "TranslationMemory" RENAME CONSTRAINT "TranslationMemory_genreId_fkey" TO "TranslationMemory_styleGuideId_fkey";

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_approvedSubmissionId_fkey" FOREIGN KEY ("approvedSubmissionId") REFERENCES "PageReviewSubmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Error" ADD CONSTRAINT "Error_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageEdit" ADD CONSTRAINT "PageEdit_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageEdit" ADD CONSTRAINT "PageEdit_editedById_fkey" FOREIGN KEY ("editedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageReviewSubmission" ADD CONSTRAINT "PageReviewSubmission_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageReviewSubmission" ADD CONSTRAINT "PageReviewSubmission_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageReviewSubmissionItem" ADD CONSTRAINT "PageReviewSubmissionItem_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "PageReviewSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranslationMemory" ADD CONSTRAINT "TranslationMemory_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "GlossaryTerm_genreId_sourceTerm_key" RENAME TO "GlossaryTerm_styleGuideId_sourceTerm_key";

-- RenameIndex
ALTER INDEX "Genre_currentVersionId_key" RENAME TO "StyleGuide_currentVersionId_key";

-- RenameIndex
ALTER INDEX "TranslationMemory_genreId_sourceLang_targetLang_idx" RENAME TO "TranslationMemory_styleGuideId_sourceLang_targetLang_idx";
