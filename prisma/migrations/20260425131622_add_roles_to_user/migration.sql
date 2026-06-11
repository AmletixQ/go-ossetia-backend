-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('USER', 'ADMIN');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "user_role" NOT NULL DEFAULT 'USER';
