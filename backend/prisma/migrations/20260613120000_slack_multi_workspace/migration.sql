-- DropIndex
DROP INDEX IF EXISTS "integrations_user_id_provider_key";

-- AlterTable
ALTER TABLE "integrations" ADD COLUMN "slack_team_id" TEXT NOT NULL DEFAULT '';
ALTER TABLE "integrations" ADD COLUMN "slack_team_name" TEXT;
ALTER TABLE "integrations" ADD COLUMN "slack_config" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "integrations_user_id_provider_slack_team_id_key" ON "integrations"("user_id", "provider", "slack_team_id");
