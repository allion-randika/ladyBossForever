-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "lastBirthdayRewardAt" TIMESTAMP(3),
ADD COLUMN     "storeCreditBalance" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "storeCreditAmount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "store_credit_transactions" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_credit_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "store_credit_transactions_customerId_idx" ON "store_credit_transactions"("customerId");

-- AddForeignKey
ALTER TABLE "store_credit_transactions" ADD CONSTRAINT "store_credit_transactions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_credit_transactions" ADD CONSTRAINT "store_credit_transactions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

