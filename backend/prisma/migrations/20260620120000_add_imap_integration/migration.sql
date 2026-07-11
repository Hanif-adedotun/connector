-- AlterEnum
ALTER TYPE "Provider" ADD VALUE 'imap';

-- AlterTable
ALTER TABLE "integrations" ADD COLUMN "imap_mailbox_id" TEXT NOT NULL DEFAULT '';
ALTER TABLE "integrations" ADD COLUMN "imap_config" JSONB;

-- DropIndex
DROP INDEX "integrations_user_id_provider_slack_team_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "integrations_user_id_provider_slack_team_id_imap_mailbox_id_key" ON "integrations"("user_id", "provider", "slack_team_id", "imap_mailbox_id");
