-- CreateTable
CREATE TABLE "want_list_items" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "preset" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "admin_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "want_list_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "want_list_items_user_id_idx" ON "want_list_items"("user_id");

-- CreateIndex
CREATE INDEX "want_list_items_status_idx" ON "want_list_items"("status");

-- CreateIndex
CREATE INDEX "want_list_items_created_at_idx" ON "want_list_items"("created_at");

-- AddForeignKey
ALTER TABLE "want_list_items" ADD CONSTRAINT "want_list_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
