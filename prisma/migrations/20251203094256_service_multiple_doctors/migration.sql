/*
  Warnings:

  - You are about to drop the column `doctorId` on the `Service` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Service" DROP CONSTRAINT "Service_doctorId_fkey";

-- DropIndex
DROP INDEX "Service_doctorId_idx";

-- AlterTable
ALTER TABLE "Service" DROP COLUMN "doctorId";

-- CreateTable
CREATE TABLE "_DoctorToService" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_DoctorToService_AB_unique" ON "_DoctorToService"("A", "B");

-- CreateIndex
CREATE INDEX "_DoctorToService_B_index" ON "_DoctorToService"("B");

-- AddForeignKey
ALTER TABLE "_DoctorToService" ADD CONSTRAINT "_DoctorToService_A_fkey" FOREIGN KEY ("A") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DoctorToService" ADD CONSTRAINT "_DoctorToService_B_fkey" FOREIGN KEY ("B") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
