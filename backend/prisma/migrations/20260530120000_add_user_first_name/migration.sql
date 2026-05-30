-- AlterTable
ALTER TABLE "users" ADD COLUMN "first_name" TEXT;

-- Remove default uuid generation; id is Supabase auth user id (existing rows unchanged)
ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT;
