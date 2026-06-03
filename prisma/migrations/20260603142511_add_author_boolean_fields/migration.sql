-- AlterTable
ALTER TABLE "Author" ADD COLUMN     "bsky_label" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "must_read" BOOLEAN NOT NULL DEFAULT false;
