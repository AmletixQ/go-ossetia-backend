/*
  Warnings:

  - You are about to drop the `_EventToUser` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `ownerId` to the `events` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_EventToUser" DROP CONSTRAINT "_EventToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_EventToUser" DROP CONSTRAINT "_EventToUser_B_fkey";

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "ownerId" TEXT NOT NULL;

-- DropTable
DROP TABLE "_EventToUser";

-- CreateTable
CREATE TABLE "_EventsUsers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EventsUsers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_EventsUsers_B_index" ON "_EventsUsers"("B");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventsUsers" ADD CONSTRAINT "_EventsUsers_A_fkey" FOREIGN KEY ("A") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventsUsers" ADD CONSTRAINT "_EventsUsers_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
