import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { QueryProductsDto } from './dto/query-products.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(query: QueryProductsDto) {
    const q = query.q?.trim();

    return this.prisma.product.findMany({
      where: {
        category: query.category ? { slug: query.category } : undefined,
        variants:
          query.size || query.color
            ? {
                some: {
                  size: query.size ? { equals: query.size } : undefined,
                  color: query.color ? { equals: query.color } : undefined,
                },
              }
            : undefined,
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' as const } },
                { description: { contains: q, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      include: { category: true, variants: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: { category: true, variants: true },
    });
    if (!product) {
      throw new NotFoundException(`Product "${slug}" not found`);
    }
    return product;
  }
}
