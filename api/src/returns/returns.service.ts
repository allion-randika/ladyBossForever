import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, ReturnStatus, ReturnType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StoreCreditService } from '../store-credit/store-credit.service';
import type { CreateReturnRequestDto } from './dto/create-return-request.dto';
import type { DecideReturnRequestDto } from './dto/decide-return-request.dto';

const ELIGIBLE_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.FULFILLED,
];

const RETURN_INCLUDE = {
  orderItem: { include: { product: true, variant: true } },
  order: { select: { number: true } },
  exchangeVariant: true,
} as const;

@Injectable()
export class ReturnsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeCredit: StoreCreditService,
  ) {}

  async requestReturn(customerId: string, dto: CreateReturnRequestDto) {
    const orderItem = await this.prisma.orderItem.findUnique({
      where: { id: dto.orderItemId },
      include: { order: true },
    });
    if (!orderItem) throw new NotFoundException('Order item not found');
    if (orderItem.order.customerId !== customerId) {
      throw new ForbiddenException();
    }
    if (!ELIGIBLE_ORDER_STATUSES.includes(orderItem.order.status)) {
      throw new BadRequestException(
        'This order is not eligible for a return or exchange',
      );
    }

    // Cap at what's actually left to return — already-requested quantity
    // (pending or resolved, but not rejected) counts against the item's qty.
    const existing = await this.prisma.returnRequest.aggregate({
      where: {
        orderItemId: dto.orderItemId,
        status: { not: ReturnStatus.REJECTED },
      },
      _sum: { qty: true },
    });
    const alreadyRequested = existing._sum.qty ?? 0;
    if (alreadyRequested + dto.qty > orderItem.qty) {
      throw new BadRequestException(
        `Only ${orderItem.qty - alreadyRequested} unit(s) of this item are eligible for return`,
      );
    }

    if (dto.type === ReturnType.EXCHANGE) {
      if (!dto.exchangeVariantId) {
        throw new BadRequestException(
          'exchangeVariantId is required for an exchange',
        );
      }
      const target = await this.prisma.productVariant.findUnique({
        where: { id: dto.exchangeVariantId },
      });
      if (!target || target.productId !== orderItem.productId) {
        throw new BadRequestException(
          'The exchange variant must belong to the same product',
        );
      }
    }

    return this.prisma.returnRequest.create({
      data: {
        orderId: orderItem.orderId,
        orderItemId: dto.orderItemId,
        customerId,
        type: dto.type,
        qty: dto.qty,
        reason: dto.reason,
        exchangeVariantId: dto.exchangeVariantId,
      },
      include: RETURN_INCLUDE,
    });
  }

  findAllForCustomer(customerId: string) {
    return this.prisma.returnRequest.findMany({
      where: { customerId },
      include: RETURN_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  findAllAdmin(status?: ReturnStatus) {
    return this.prisma.returnRequest.findMany({
      where: status ? { status } : undefined,
      include: {
        ...RETURN_INCLUDE,
        customer: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async decide(id: string, dto: DecideReturnRequestDto) {
    const request = await this.prisma.returnRequest.findUnique({
      where: { id },
      include: { orderItem: true },
    });
    if (!request) throw new NotFoundException('Return request not found');
    if (request.status !== ReturnStatus.REQUESTED) {
      throw new BadRequestException('This request has already been decided');
    }

    if (dto.decision === 'REJECT') {
      return this.prisma.returnRequest.update({
        where: { id },
        data: { status: ReturnStatus.REJECTED, adminNote: dto.adminNote },
        include: RETURN_INCLUDE,
      });
    }

    if (request.type === ReturnType.RETURN) {
      return this.prisma.$transaction(async (tx) => {
        await tx.productVariant.update({
          where: { id: request.orderItem.variantId },
          data: { stock: { increment: request.qty } },
        });
        await this.storeCredit.grant(
          request.customerId,
          request.qty * request.orderItem.unitPrice,
          `Return refund — order item ${request.orderItemId}`,
        );
        return tx.returnRequest.update({
          where: { id },
          data: { status: ReturnStatus.REFUNDED, adminNote: dto.adminNote },
          include: RETURN_INCLUDE,
        });
      });
    }

    // EXCHANGE
    if (!request.exchangeVariantId) {
      throw new BadRequestException('This request has no exchange variant');
    }
    return this.prisma.$transaction(async (tx) => {
      const target = await tx.productVariant.findUnique({
        where: { id: request.exchangeVariantId! },
      });
      if (!target || target.stock < request.qty) {
        throw new BadRequestException(
          'The requested exchange variant no longer has enough stock',
        );
      }
      await tx.productVariant.update({
        where: { id: request.orderItem.variantId },
        data: { stock: { increment: request.qty } },
      });
      await tx.productVariant.update({
        where: { id: request.exchangeVariantId! },
        data: { stock: { decrement: request.qty } },
      });
      return tx.returnRequest.update({
        where: { id },
        data: { status: ReturnStatus.EXCHANGED, adminNote: dto.adminNote },
        include: RETURN_INCLUDE,
      });
    });
  }
}
