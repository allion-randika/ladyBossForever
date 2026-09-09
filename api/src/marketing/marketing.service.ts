import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

type Stage = 1 | 2 | 3;

const STAGE_THRESHOLDS_MS: Record<Stage, number> = {
  1: 60 * 60 * 1000, // 1h
  2: 24 * 60 * 60 * 1000, // 24h
  3: 48 * 60 * 60 * 1000, // 48h
};

@Injectable()
export class MarketingService {
  private readonly logger = new Logger(MarketingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  // Runs hourly; also exposed via a manual admin endpoint (see controller)
  // since waiting hours for a real threshold to pass isn't practical to
  // verify by hand.
  @Cron(CronExpression.EVERY_HOUR)
  async runAbandonedCartCheck() {
    const now = new Date();
    const carts = await this.prisma.cartItem.groupBy({
      by: ['customerId'],
      _max: { updatedAt: true },
      _count: { _all: true },
    });

    let remindersSent = 0;
    for (const cart of carts) {
      const { customerId } = cart;
      const cartUpdatedAt = cart._max.updatedAt;
      if (!cartUpdatedAt) continue;

      const eligibleStage = this.eligibleStage(now, cartUpdatedAt);
      if (!eligibleStage) continue;

      // Defensive: checkout clears cart items, so a customer with an order
      // placed after this cart activity shouldn't still be "abandoning" it.
      const recentOrder = await this.prisma.order.findFirst({
        where: { customerId, createdAt: { gte: cartUpdatedAt } },
        select: { id: true },
      });
      if (recentOrder) continue;

      const reminder = await this.prisma.cartReminder.findUnique({
        where: { customerId },
      });
      // A cart that changed since the last reminder starts its stages over.
      const currentStage =
        reminder && reminder.cartUpdatedAt.getTime() === cartUpdatedAt.getTime()
          ? reminder.stage
          : 0;
      if (currentStage >= eligibleStage) continue;

      await this.email.sendAbandonedCartReminder(
        customerId,
        eligibleStage,
        cart._count._all,
      );
      await this.prisma.cartReminder.upsert({
        where: { customerId },
        create: { customerId, stage: eligibleStage, cartUpdatedAt },
        update: { stage: eligibleStage, cartUpdatedAt },
      });
      remindersSent++;
    }

    this.logger.log(`Abandoned cart check: sent ${remindersSent} reminder(s)`);
    return { remindersSent };
  }

  private eligibleStage(now: Date, cartUpdatedAt: Date): Stage | null {
    const elapsedMs = now.getTime() - cartUpdatedAt.getTime();
    if (elapsedMs >= STAGE_THRESHOLDS_MS[3]) return 3;
    if (elapsedMs >= STAGE_THRESHOLDS_MS[2]) return 2;
    if (elapsedMs >= STAGE_THRESHOLDS_MS[1]) return 1;
    return null;
  }
}
