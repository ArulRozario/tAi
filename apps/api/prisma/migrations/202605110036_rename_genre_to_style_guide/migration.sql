-- Rename tables
ALTER TABLE "Genre" RENAME TO "StyleGuide";
ALTER TABLE "GenreVersion" RENAME TO "StyleGuideVersion";

-- Rename columns
ALTER TABLE "Project" RENAME COLUMN "genreId" TO "styleGuideId";
ALTER TABLE "GlossaryTerm" RENAME COLUMN "genreId" TO "styleGuideId";
ALTER TABLE "TranslationMemory" RENAME COLUMN "genreId" TO "styleGuideId";
ALTER TABLE "StyleGuideVersion" RENAME COLUMN "genreId" TO "styleGuideId";

-- Update ActivityLog entityType values
UPDATE "ActivityLog" SET "entityType" = 'styleGuide' WHERE "entityType" = 'genre';

-- Add STYLE_GUIDE to ChatContext enum
ALTER TYPE "ChatContext" ADD VALUE 'STYLE_GUIDE';
