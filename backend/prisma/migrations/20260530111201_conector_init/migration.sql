-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('google_calendar', 'gmail', 'slack', 'jira', 'discord');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('active', 'disconnected', 'error');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('open', 'done', 'dismissed');

-- CreateEnum
CREATE TYPE "PollingJobStatus" AS ENUM ('queued', 'running', 'succeeded', 'failed');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integrations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" "Provider" NOT NULL,
    "encrypted_access_token" TEXT NOT NULL,
    "encrypted_refresh_token" TEXT,
    "scope" TEXT,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'active',
    "last_polled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connector_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" "Provider" NOT NULL,
    "external_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "metadata_json" JSONB,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "connector_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extracted_tasks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "source_event_id" TEXT,
    "provider" "Provider" NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "due_date" TIMESTAMP(3),
    "confidence" DOUBLE PRECISION NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "extracted_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "polling_jobs" (
    "id" TEXT NOT NULL,
    "integration_id" TEXT NOT NULL,
    "status" "PollingJobStatus" NOT NULL DEFAULT 'queued',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "polling_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "integrations_user_id_idx" ON "integrations"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "integrations_user_id_provider_key" ON "integrations"("user_id", "provider");

-- CreateIndex
CREATE INDEX "connector_events_user_id_processed_idx" ON "connector_events"("user_id", "processed");

-- CreateIndex
CREATE UNIQUE INDEX "connector_events_provider_external_id_key" ON "connector_events"("provider", "external_id");

-- CreateIndex
CREATE INDEX "extracted_tasks_user_id_status_idx" ON "extracted_tasks"("user_id", "status");

-- CreateIndex
CREATE INDEX "extracted_tasks_user_id_created_at_idx" ON "extracted_tasks"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "polling_jobs_integration_id_status_idx" ON "polling_jobs"("integration_id", "status");

-- AddForeignKey
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connector_events" ADD CONSTRAINT "connector_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extracted_tasks" ADD CONSTRAINT "extracted_tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extracted_tasks" ADD CONSTRAINT "extracted_tasks_source_event_id_fkey" FOREIGN KEY ("source_event_id") REFERENCES "connector_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polling_jobs" ADD CONSTRAINT "polling_jobs_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
