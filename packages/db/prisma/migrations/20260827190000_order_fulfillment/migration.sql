-- AlterTable
ALTER TABLE "orders" ADD COLUMN "fulfillment_step" TEXT;
ALTER TABLE "orders" ADD COLUMN "carrier_name" TEXT;
ALTER TABLE "orders" ADD COLUMN "tracking_url" TEXT;
