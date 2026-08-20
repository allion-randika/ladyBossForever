import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllForCustomer(customerId: string): Promise<string[]> {
    const items = await this.prisma.wishlistItem.findMany({
      where: { customerId },
      select: { productId: true },
    });
    return items.map((i) => i.productId);
  }

  async add(customerId: string, productId: string): Promise<string[]> {
    await this.prisma.wishlistItem.upsert({
      where: { customerId_productId: { customerId, productId } },
      update: {},
      create: { customerId, productId },
    });
    return this.findAllForCustomer(customerId);
  }

  async remove(customerId: string, productId: string): Promise<string[]> {
    await this.prisma.wishlistItem.deleteMany({
      where: { customerId, productId },
    });
    return this.findAllForCustomer(customerId);
  }

  async sync(customerId: string, productIds: string[]): Promise<string[]> {
    const existing = new Set(await this.findAllForCustomer(customerId));
    const toAdd = productIds.filter((id) => !existing.has(id));
    if (toAdd.length > 0) {
      await this.prisma.wishlistItem.createMany({
        data: toAdd.map((productId) => ({ customerId, productId })),
        skipDuplicates: true,
      });
    }
    return this.findAllForCustomer(customerId);
  }
}
