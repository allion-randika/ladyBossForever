import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

// A flat bonus rather than a configurable admin setting — one number,
// easy to change in code, not worth a whole settings model for MVP.
const BIRTHDAY_BONUS_AMOUNT = 500; // LKR

export interface StoreCreditApplication {
  amountApplied: number;
}

@Injectable()
export class StoreCreditService {
  private readonly logger = new Logger(StoreCreditService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  async grant(customerId: string, amount: number, reason: string) {
    const [, customer] = await this.prisma.$transaction([
      this.prisma.storeCreditTransaction.create({
        data: { customerId, amount, reason },
      }),
      this.prisma.customer.update({
        where: { id: customerId },
        data: { storeCreditBalance: { increment: amount } },
        // Explicit select — never let passwordHash leak through here.
        select: { id: true, email: true, storeCreditBalance: true },
      }),
    ]);
    return customer;
  }

  getLedger(customerId: string) {
    return this.prisma.storeCreditTransaction.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: { order: { select: { number: true } } },
    });
  }

  /**
   * Server-authoritative validation for checkout redemption. The customer
   * picks how much of their balance to use (not all-or-nothing); this caps
   * that request at both their real balance and whatever's still owed after
   * discount and gift card, never trusting either number from the client.
   */
  async validateForRedemption(
    customerId: string,
    requestedAmount: number,
    maxAmount: number,
  ): Promise<StoreCreditApplication> {
    if (requestedAmount <= 0) return { amountApplied: 0 };
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { storeCreditBalance: true },
    });
    return {
      amountApplied: Math.min(
        customer?.storeCreditBalance ?? 0,
        maxAmount,
        requestedAmount,
      ),
    };
  }

  // Called from inside the order-creation transaction so the deduction and
  // the order it paid for commit or roll back together.
  async redeem(
    tx: Prisma.TransactionClient,
    customerId: string,
    amount: number,
    orderId: string,
  ) {
    if (amount <= 0) return;
    await tx.storeCreditTransaction.create({
      data: {
        customerId,
        amount: -amount,
        reason: 'Redeemed at checkout',
        orderId,
      },
    });
    await tx.customer.update({
      where: { id: customerId },
      data: { storeCreditBalance: { decrement: amount } },
    });
  }

  // Runs daily; also exposed via a manual admin endpoint (see controller)
  // since waiting for a real birthday to roll around isn't practical to
  // verify by hand.
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async runBirthdayCheck() {
    const now = new Date();
    const customers = await this.prisma.customer.findMany({
      where: { birthday: { not: null } },
      select: { id: true, birthday: true, lastBirthdayRewardAt: true },
    });

    let rewarded = 0;
    for (const customer of customers) {
      if (!customer.birthday) continue;
      const isBirthdayToday =
        customer.birthday.getUTCMonth() === now.getUTCMonth() &&
        customer.birthday.getUTCDate() === now.getUTCDate();
      if (!isBirthdayToday) continue;

      const alreadyRewardedThisYear =
        customer.lastBirthdayRewardAt &&
        customer.lastBirthdayRewardAt.getUTCFullYear() === now.getUTCFullYear();
      if (alreadyRewardedThisYear) continue;

      await this.grant(
        customer.id,
        BIRTHDAY_BONUS_AMOUNT,
        'Birthday bonus \u{1F382}',
      );
      await this.prisma.customer.update({
        where: { id: customer.id },
        data: { lastBirthdayRewardAt: now },
      });
      await this.email.sendBirthdayBonus(customer.id, BIRTHDAY_BONUS_AMOUNT);
      rewarded++;
    }

    this.logger.log(`Birthday check: rewarded ${rewarded} customer(s)`);
    return { rewarded };
  }
}
