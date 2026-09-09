-- CreateEnum
CREATE TYPE "EmailType" AS ENUM ('WELCOME', 'ORDER_CONFIRMATION', 'ABANDONED_CART', 'BACK_IN_STOCK', 'PRICE_DROP', 'BIRTHDAY_BONUS');

-- CreateTable
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "type" "EmailType" NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "customerId" TEXT,
    "metadata" JSONB,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_reminders" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "stage" INTEGER NOT NULL DEFAULT 0,
    "cartUpdatedAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cart_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_logs_customerId_idx" ON "email_logs"("customerId");

-- CreateIndex
CREATE INDEX "email_logs_type_idx" ON "email_logs"("type");

-- CreateIndex
CREATE UNIQUE INDEX "cart_reminders_customerId_key" ON "cart_reminders"("customerId");

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_reminders" ADD CONSTRAINT "cart_reminders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

