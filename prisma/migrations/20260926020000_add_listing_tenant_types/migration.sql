-- AlterTable
ALTER TABLE "listings" ADD COLUMN "tenant_types" TEXT[] DEFAULT ARRAY[]::TEXT[];
