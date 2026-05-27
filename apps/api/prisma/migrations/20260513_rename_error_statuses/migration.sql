-- Replace ERROR/ESCALATED with RENDER_ERROR and TRANSLATION_ERROR

-- Step 1: Convert column to text first (avoids "new enum value not yet committed" error)
ALTER TABLE "Page" ALTER COLUMN status DROP DEFAULT;
ALTER TABLE "Page" ALTER COLUMN status TYPE text USING status::text;

-- Step 2: Migrate existing data as text (no enum constraint at this point)
-- Existing ERROR rows were translation failures
UPDATE "Page" SET status = 'TRANSLATION_ERROR' WHERE status = 'ERROR';
-- ESCALATED pages go to HUMAN_REVIEW (closest meaningful state)
UPDATE "Page" SET status = 'HUMAN_REVIEW' WHERE status = 'ESCALATED';

-- Step 3: Recreate enum with new values, dropping old ERROR/ESCALATED
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

-- Step 4: Cast column back to the new enum type
ALTER TABLE "Page" ALTER COLUMN status TYPE "PageStatus" USING status::"PageStatus";
ALTER TABLE "Page" ALTER COLUMN status SET DEFAULT 'PENDING';
