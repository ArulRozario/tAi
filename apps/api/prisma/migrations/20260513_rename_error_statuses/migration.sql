-- Replace ERROR/ESCALATED with RENDER_ERROR and TRANSLATION_ERROR

-- Step 1: Add new values
ALTER TYPE "PageStatus" ADD VALUE IF NOT EXISTS 'RENDER_ERROR';
ALTER TYPE "PageStatus" ADD VALUE IF NOT EXISTS 'TRANSLATION_ERROR';

-- Step 2: Migrate existing data
-- Existing ERROR rows were translation failures
UPDATE "Page" SET status = 'TRANSLATION_ERROR' WHERE status = 'ERROR';
-- ESCALATED pages go to HUMAN_REVIEW (closest meaningful state)
UPDATE "Page" SET status = 'HUMAN_REVIEW' WHERE status = 'ESCALATED';

-- Step 3: Recreate enum without old values
ALTER TABLE "Page" ALTER COLUMN status DROP DEFAULT;
ALTER TABLE "Page" ALTER COLUMN status TYPE text USING status::text;
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
  'RENDER_ERROR',
  'TRANSLATION_ERROR'
);
ALTER TABLE "Page" ALTER COLUMN status TYPE "PageStatus" USING status::"PageStatus";
ALTER TABLE "Page" ALTER COLUMN status SET DEFAULT 'PENDING';
