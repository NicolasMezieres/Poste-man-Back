/*
  Warnings:

  - You are about to alter the column `image` on the `Icon` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(2)`.

*/
-- AlterTable
ALTER TABLE "Icon" ALTER COLUMN "image" SET DATA TYPE VARCHAR(2);
