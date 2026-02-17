/*
  Warnings:

  - You are about to drop the column `isArchive` on the `Post` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Post" DROP COLUMN "isArchive";

-- AddForeignKey
ALTER TABLE "public"."Link_Project" ADD CONSTRAINT "Link_Project_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
