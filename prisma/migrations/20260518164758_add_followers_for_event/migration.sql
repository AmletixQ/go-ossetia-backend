-- CreateTable
CREATE TABLE "_EventsFollowers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EventsFollowers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_EventsFollowers_B_index" ON "_EventsFollowers"("B");

-- AddForeignKey
ALTER TABLE "_EventsFollowers" ADD CONSTRAINT "_EventsFollowers_A_fkey" FOREIGN KEY ("A") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventsFollowers" ADD CONSTRAINT "_EventsFollowers_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
