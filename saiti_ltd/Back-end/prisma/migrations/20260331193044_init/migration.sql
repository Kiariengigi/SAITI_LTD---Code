-- CreateEnum
CREATE TYPE "Role" AS ENUM ('WHOLESALER', 'MERCHANT', 'PRODUCER', 'ADMIN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phone_number" INTEGER,
ADD COLUMN     "role_type" "Role" NOT NULL DEFAULT 'WHOLESALER';

-- CreateTable
CREATE TABLE "producers" (
    "producer_id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "producers_pkey" PRIMARY KEY ("producer_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "producers_userId_key" ON "producers"("userId");

-- CreateIndex
CREATE INDEX "idx_email_role" ON "User"("email", "role_type");

-- AddForeignKey
ALTER TABLE "producers" ADD CONSTRAINT "producers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
