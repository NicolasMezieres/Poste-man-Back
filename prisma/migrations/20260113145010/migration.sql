/*
  Warnings:

  - You are about to drop the `Icon` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_iconId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "icon" VARCHAR(50);

-- DropTable
DROP TABLE "Icon";
