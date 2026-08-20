import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { OrderStatus, type Order } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import type {
  CreateGuestOrderDto,
  CreateOrderDto,
  OrderItemInput,
  ShippingAddressInput,
} from './dto/create-order.dto';
import type { PaymentMethod } from '@prisma/client';

const ORDER_INCLUDE = {
  items: { include: { product: true, variant: true } },
  shippingAddress: true,
} as const;

export interface OrderRequester {
  customerId?: string;
  guestToken?: string;
}

function generateOrderNumber(): string {
  return `LB${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: PaymentsService,
  ) {}

  async create(customerId: string, dto: CreateOrderDto) {
    const order = await this.createOrderRecord(
      customerId,
      dto.items,
      dto.shippingAddress,
      dto.paymentMethod,
    );
    const payment = await this.payments.initiate(order, dto.paymentMethod);
    return { order, payment };
  }

  async createGuest(dto: CreateGuestOrderDto) {
    const customer = await this.findOrCreateGuestCustomer(
      dto.email,
      dto.firstName,
      dto.lastName,
    );
    const guestToken = randomUUID();
    const order = await this.createOrderRecord(
      customer.id,
      dto.items,
      dto.shippingAddress,
      dto.paymentMethod,
      guestToken,
    );
    const payment = await this.payments.initiate(order, dto.paymentMethod);
    // Guests have no session — the confirm/lookup steps authenticate via
    // this token instead, so it has to travel with the redirect.
    payment.redirectUrl += `&guestToken=${guestToken}`;
    return { order, payment, guestToken };
  }

  async findAllForCustomer(customerId: string) {
    return this.prisma.order.findMany({
      where: { customerId },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOrderForRequester(orderId: string, requester: OrderRequester) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: ORDER_INCLUDE,
    });
    if (!order) throw new NotFoundException('Order not found');
    this.assertAccess(order, requester);
    return order;
  }

  /**
   * Stands in for a real provider's signed webhook callback. A production
   * integration verifies the callback signature and never trusts the
   * customer's browser directly for this — see MockRedirectProvider.
   */
  async confirmPayment(orderId: string, requester: OrderRequester) {
    const order = await this.findOrderForRequester(orderId, requester);
    if (order.status !== OrderStatus.PENDING) {
      return order;
    }
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.PAID },
      include: ORDER_INCLUDE,
    });
  }

  private assertAccess(order: Order, requester: OrderRequester) {
    if (requester.customerId && order.customerId === requester.customerId)
      return;
    if (
      requester.guestToken &&
      order.guestToken &&
      order.guestToken === requester.guestToken
    )
      return;
    if (!requester.customerId && !requester.guestToken)
      throw new UnauthorizedException();
    throw new ForbiddenException();
  }

  private async findOrCreateGuestCustomer(
    email: string,
    firstName: string,
    lastName: string,
  ) {
    const existing = await this.prisma.customer.findUnique({
      where: { email },
    });
    if (existing) {
      // A password on the record means this is someone's real account.
      // Silently attaching a guest order to it would let anyone who knows
      // that email inject orders into a stranger's order history — no
      // authentication required. Refuse instead of reusing it.
      if (existing.passwordHash) {
        throw new BadRequestException(
          'An account already exists with this email. Please sign in to check out.',
        );
      }
      return existing;
    }
    return this.prisma.customer.create({
      data: { email, firstName, lastName, passwordHash: null },
    });
  }

  private async createOrderRecord(
    customerId: string,
    items: OrderItemInput[],
    shippingAddress: ShippingAddressInput,
    paymentMethod: PaymentMethod,
    guestToken?: string,
  ) {
    const variantIds = items.map((i) => i.variantId);
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { product: true },
    });

    if (variants.length !== new Set(variantIds).size) {
      throw new BadRequestException(
        'One or more items in your bag are no longer available',
      );
    }

    const variantById = new Map(variants.map((v) => [v.id, v]));

    for (const item of items) {
      const variant = variantById.get(item.variantId);
      if (!variant || variant.productId !== item.productId) {
        throw new BadRequestException(
          'One or more items in your bag are no longer available',
        );
      }
      if (variant.stock < item.qty) {
        throw new BadRequestException(
          `Only ${variant.stock} left of ${variant.product.name} (${variant.color}, ${variant.size})`,
        );
      }
    }

    const subtotal = items.reduce((sum, item) => {
      const variant = variantById.get(item.variantId)!;
      return sum + variant.product.price * item.qty;
    }, 0);

    return this.prisma.$transaction(async (tx) => {
      const address = await tx.address.create({
        data: { customerId, ...shippingAddress },
      });

      const created = await tx.order.create({
        data: {
          number: generateOrderNumber(),
          customerId,
          shippingAddressId: address.id,
          paymentMethod,
          subtotal,
          total: subtotal,
          guestToken,
          items: {
            create: items.map((item) => {
              const variant = variantById.get(item.variantId)!;
              return {
                productId: item.productId,
                variantId: item.variantId,
                qty: item.qty,
                unitPrice: variant.product.price,
              };
            }),
          },
        },
        include: ORDER_INCLUDE,
      });

      for (const item of items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.qty } },
        });
      }

      return created;
    });
  }
}
