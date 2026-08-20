-- AlterTable
ALTER TABLE "customers" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "guestToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "orders_guestToken_key" ON "orders"("guestToken");
