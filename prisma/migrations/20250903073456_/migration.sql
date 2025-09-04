/*
  Warnings:

  - You are about to drop the column `activationToke` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Link_Project" DROP CONSTRAINT "Link_Project_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."User_Has_Project" DROP CONSTRAINT "User_Has_Project_projectId_fkey";

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "activationToke",
ADD COLUMN     "activateToken" VARCHAR(255);

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User_Has_Project" ADD CONSTRAINT "User_Has_Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User_Has_Project" ADD CONSTRAINT "User_Has_Project_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Link_Project" ADD CONSTRAINT "Link_Project_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
