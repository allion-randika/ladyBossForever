import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { GiftCardStatus, type GiftCard, type Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { PurchaseGiftCardDto } from './dto/purchase-gift-card.dto';
import type { IssueGiftCardDto } from './dto/issue-gift-card.dto';

// Excludes 0/O and 1/I/L to avoid characters that are easy to misread when
// a code is read aloud or typed off a printed card.
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateCode(): string {
  const bytes = randomBytes(12);
  let code = 'GC';
  for (let i = 0; i < 12; i++) {
    if (i % 4 === 0) code += '-';
    code += CODE_CHARS[bytes[i] % CODE_CHARS.length];
  }
  return code;
}

export interface GiftCardApplication {
  giftCard: GiftCard;
  amountApplied: number;
}

@Injectable()
export class GiftCardsService {
  constructor(private readonly prisma: PrismaService) {}

  purchase(purchaserId: string, dto: PurchaseGiftCardDto) {
    return this.prisma.giftCard.create({
      data: {
        code: generateCode(),
        initialBalance: dto.amount,
        balance: dto.amount,
        purchaserId,
        recipientEmail: dto.recipientEmail,
        recipientName: dto.recipientName,
        message: dto.message,
      },
    });
  }

  issue(adminId: string, dto: IssueGiftCardDto) {
    return this.prisma.giftCard.create({
      data: {
        code: generateCode(),
        initialBalance: dto.amount,
        balance: dto.amount,
        issuedByAdminId: adminId,
        recipientEmail: dto.recipientEmail,
        recipientName: dto.recipientName,
        message: dto.message,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });
  }

  findMine(customerId: string) {
    return this.prisma.giftCard.findMany({
      where: { purchaserId: customerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findAllAdmin() {
    return this.prisma.giftCard.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        purchaser: { select: { id: true, email: true } },
        issuedByAdmin: { select: { id: true, name: true } },
      },
    });
  }

  // Public balance check — deliberately excludes purchaser/admin identity,
  // since knowing the code (like a real gift card) is the only "auth"
  // needed to check what's left on it.
  async findByCode(code: string) {
    const giftCard = await this.prisma.giftCard.findUnique({
      where: { code: code.trim().toUpperCase() },
      select: {
        code: true,
        balance: true,
        initialBalance: true,
        status: true,
        expiresAt: true,
      },
    });
    if (!giftCard) throw new NotFoundException('Gift card not found');
    return giftCard;
  }

  /**
   * Server-authoritative validation, used both for checkout's "apply this
   * card" preview and again at order-creation time — never trust a
   * client-submitted redemption amount.
   */
  async validateForRedemption(
    code: string,
    maxAmount: number,
  ): Promise<GiftCardApplication> {
    const giftCard = await this.prisma.giftCard.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
    if (!giftCard) throw new BadRequestException('Invalid gift card code');
    if (giftCard.status !== GiftCardStatus.ACTIVE) {
      throw new BadRequestException('This gift card is no longer active');
    }
    if (giftCard.expiresAt && new Date() > giftCard.expiresAt) {
      throw new BadRequestException('This gift card has expired');
    }
    if (giftCard.balance <= 0) {
      throw new BadRequestException('This gift card has no remaining balance');
    }

    return { giftCard, amountApplied: Math.min(giftCard.balance, maxAmount) };
  }

  // Called from inside the order-creation transaction so the balance
  // decrement and the order it paid for commit or roll back together.
  async redeem(
    tx: Prisma.TransactionClient,
    giftCardId: string,
    amount: number,
  ) {
    const giftCard = await tx.giftCard.update({
      where: { id: giftCardId },
      data: { balance: { decrement: amount } },
    });
    if (giftCard.balance <= 0) {
      await tx.giftCard.update({
        where: { id: giftCardId },
        data: { status: GiftCardStatus.REDEEMED },
      });
    }
  }
}
