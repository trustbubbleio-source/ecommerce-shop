-- CreateTable
CREATE TABLE "restoration_submissions" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "package_interest" TEXT NOT NULL DEFAULT 'unsure',
    "photos" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "admin_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restoration_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "restoration_submissions_status_idx" ON "restoration_submissions"("status");

-- CreateIndex
CREATE INDEX "restoration_submissions_created_at_idx" ON "restoration_submissions"("created_at");

-- CreateIndex
CREATE INDEX "restoration_submissions_email_idx" ON "restoration_submissions"("email");
