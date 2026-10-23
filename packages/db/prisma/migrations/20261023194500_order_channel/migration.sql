-- AlterTable
ALTER TABLE "orders" ADD COLUMN "channel" TEXT NOT NULL DEFAULT 'online';

-- CreateIndex
CREATE INDEX "orders_channel_idx" ON "orders"("channel");
