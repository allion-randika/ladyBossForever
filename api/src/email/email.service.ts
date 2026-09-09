import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MockEmailProvider } from './providers/mock-email.provider';
import type { EmailProvider } from './email.types';

@Injectable()
export class EmailService {
  private readonly provider: EmailProvider;

  constructor(private readonly prisma: PrismaService) {
    this.provider = new MockEmailProvider(prisma);
  }

  private customerContact(customerId: string) {
    return this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, email: true, firstName: true },
    });
  }

  async sendWelcome(customerId: string) {
    const customer = await this.customerContact(customerId);
    if (!customer) return;
    await this.provider.send({
      type: 'WELCOME',
      to: customer.email,
      subject: `Welcome to Lady Boss Forever, ${customer.firstName}!`,
      customerId: customer.id,
    });
  }

  async sendOrderConfirmation(
    customerId: string,
    order: { number: string; total: number },
  ) {
    const customer = await this.customerContact(customerId);
    if (!customer) return;
    await this.provider.send({
      type: 'ORDER_CONFIRMATION',
      to: customer.email,
      subject: `Your Lady Boss Forever order #${order.number} is confirmed`,
      customerId: customer.id,
      metadata: { orderNumber: order.number, total: order.total },
    });
  }

  async sendAbandonedCartReminder(
    customerId: string,
    stage: 1 | 2 | 3,
    itemCount: number,
  ) {
    const customer = await this.customerContact(customerId);
    if (!customer) return;
    const subjectByStage: Record<1 | 2 | 3, string> = {
      1: 'You left something in your bag',
      2: 'Still thinking it over? Your bag is waiting',
      3: 'Last chance — your bag expires soon',
    };
    await this.provider.send({
      type: 'ABANDONED_CART',
      to: customer.email,
      subject: subjectByStage[stage],
      customerId: customer.id,
      metadata: { stage, itemCount },
    });
  }

  async sendBackInStockAlert(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, slug: true },
    });
    if (!product) return;

    const wishlisters = await this.prisma.wishlistItem.findMany({
      where: { productId },
      select: { customer: { select: { id: true, email: true } } },
    });
    for (const { customer } of wishlisters) {
      await this.provider.send({
        type: 'BACK_IN_STOCK',
        to: customer.email,
        subject: `${product.name} is back in stock`,
        customerId: customer.id,
        metadata: { productId: product.id, slug: product.slug },
      });
    }
  }

  async sendPriceDropAlert(
    productId: string,
    oldPrice: number,
    newPrice: number,
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, slug: true },
    });
    if (!product) return;

    const wishlisters = await this.prisma.wishlistItem.findMany({
      where: { productId },
      select: { customer: { select: { id: true, email: true } } },
    });
    for (const { customer } of wishlisters) {
      await this.provider.send({
        type: 'PRICE_DROP',
        to: customer.email,
        subject: `${product.name} just dropped in price`,
        customerId: customer.id,
        metadata: {
          productId: product.id,
          slug: product.slug,
          oldPrice,
          newPrice,
        },
      });
    }
  }

  async sendBirthdayBonus(customerId: string, amount: number) {
    const customer = await this.customerContact(customerId);
    if (!customer) return;
    await this.provider.send({
      type: 'BIRTHDAY_BONUS',
      to: customer.email,
      subject: `Happy birthday from Lady Boss Forever \u{1F382}`,
      customerId: customer.id,
      metadata: { amount },
    });
  }
}
