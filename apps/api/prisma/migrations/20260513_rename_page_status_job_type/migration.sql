-- Rename PageStatus: EXTRACTING→RENDERING, EXTRACTED→READY
-- Rename JobType: PROCESS_DOCUMENT→SPLIT_DOCUMENT, EXTRACT_PAGE→RENDER_PAGE, remove DETECT_CHAPTERS

-- Step 1: Convert Page.status to text first (avoids "new enum value not yet committed" error)
ALTER TABLE "Page" ALTER COLUMN status DROP DEFAULT;
ALTER TABLE "Page" ALTER COLUMN status TYPE text USING status::text;

-- Step 2: Migrate Page status data as text (no enum constraint at this point)
UPDATE "Page" SET status = 'RENDERING' WHERE status = 'EXTRACTING';
UPDATE "Page" SET status = 'READY'     WHERE status = 'EXTRACTED';

-- Step 3: Recreate PageStatus enum without old EXTRACTING/EXTRACTED values
DROP TYPE "PageStatus";
CREATE TYPE "PageStatus" AS ENUM (
  'PENDING',
  'RENDERING',
  'READY',
  'TRANSLATING',
  'TRANSLATED',
  'REVIEWING',
  'HUMAN_REVIEW',
  'APPROVED',
  'REJECTED',
  'ESCALATED',
  'ERROR'
);

-- Step 4: Cast Page.status back to the new enum type
ALTER TABLE "Page" ALTER COLUMN status TYPE "PageStatus" USING status::"PageStatus";
ALTER TABLE "Page" ALTER COLUMN status SET DEFAULT 'PENDING';

-- Step 5: Convert Job.type to text first
ALTER TABLE "Job" ALTER COLUMN type TYPE text USING type::text;

-- Step 6: Migrate Job type data as text
UPDATE "Job" SET type = 'SPLIT_DOCUMENT' WHERE type = 'PROCESS_DOCUMENT';
UPDATE "Job" SET type = 'RENDER_PAGE'    WHERE type = 'EXTRACT_PAGE';
UPDATE "Job" SET status = 'CANCELLED'    WHERE type = 'DETECT_CHAPTERS' AND status = 'QUEUED';

-- Step 7: Recreate JobType enum without old PROCESS_DOCUMENT/EXTRACT_PAGE/DETECT_CHAPTERS values
DROP TYPE "JobType";
CREATE TYPE "JobType" AS ENUM (
  'SPLIT_DOCUMENT',
  'RENDER_PAGE',
  'TRANSLATE_BATCH',
  'REVIEW_PAGE',
  'INDEX_MEMORY',
  'EXPORT_PROJECT',
  'EXPORT_PAGE_REPORT',
  'EXPORT_ADMIN_REPORT'
);

-- Step 8: Cast Job.type back to the new enum type
ALTER TABLE "Job" ALTER COLUMN type TYPE "JobType" USING type::"JobType";
