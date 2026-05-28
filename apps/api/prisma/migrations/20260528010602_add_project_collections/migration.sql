-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "collectionId" TEXT;

-- CreateTable
CREATE TABLE "ProjectCollection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "parentId" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectCollection_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProjectCollection" ADD CONSTRAINT "ProjectCollection_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ProjectCollection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "ProjectCollection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
