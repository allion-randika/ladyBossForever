import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CartLineDto, RemoveCartLineDto } from './dto/cart-line.dto';

export interface CartLine {
  productId: string;
  size: string;
  color: string;
  qty: number;
}

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllForCustomer(customerId: string): Promise<CartLine[]> {
    const items = await this.prisma.cartItem.findMany({
      where: { customerId },
      select: { productId: true, size: true, color: true, qty: true },
      orderBy: { createdAt: 'asc' },
    });
    return items;
  }

  async addOrIncrement(
    customerId: string,
    line: CartLineDto,
  ): Promise<CartLine[]> {
    const key = {
      customerId_productId_size_color: { customerId, ...lineKey(line) },
    };
    const existing = await this.prisma.cartItem.findUnique({ where: key });
    if (existing) {
      await this.prisma.cartItem.update({
        where: key,
        data: { qty: existing.qty + line.qty },
      });
    } else {
      await this.prisma.cartItem.create({
        data: { customerId, ...lineKey(line), qty: line.qty },
      });
    }
    return this.findAllForCustomer(customerId);
  }

  async setQty(customerId: string, line: CartLineDto): Promise<CartLine[]> {
    await this.prisma.cartItem.upsert({
      where: {
        customerId_productId_size_color: { customerId, ...lineKey(line) },
      },
      update: { qty: line.qty },
      create: { customerId, ...lineKey(line), qty: line.qty },
    });
    return this.findAllForCustomer(customerId);
  }

  async remove(
    customerId: string,
    line: RemoveCartLineDto,
  ): Promise<CartLine[]> {
    await this.prisma.cartItem.deleteMany({
      where: { customerId, ...lineKey(line) },
    });
    return this.findAllForCustomer(customerId);
  }

  async clear(customerId: string): Promise<CartLine[]> {
    await this.prisma.cartItem.deleteMany({ where: { customerId } });
    return [];
  }

  async sync(customerId: string, lines: CartLineDto[]): Promise<CartLine[]> {
    for (const line of lines) {
      await this.addOrIncrement(customerId, line);
    }
    return this.findAllForCustomer(customerId);
  }
}

function lineKey(line: { productId: string; size: string; color: string }) {
  return { productId: line.productId, size: line.size, color: line.color };
}
