-- AlterTable
ALTER TABLE "public"."Message" ADD COLUMN     "isArchive" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."Post" ADD COLUMN     "isArchive" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."Project" ADD COLUMN     "isArchive" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."Section" ADD COLUMN     "isArchive" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "isArchive" BOOLEAN NOT NULL DEFAULT false;
