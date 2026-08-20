import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { QueryProductsDto } from './dto/query-products.dto';
import type { CreateProductDto } from './dto/create-product.dto';
import type { UpdateProductDto } from './dto/update-product.dto';
import type { AddVariantDto, UpdateVariantDto } from './dto/variant.dto';

const ADMIN_PRODUCT_INCLUDE = { category: true, variants: true } as const;

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

  async findByIdOrThrow(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: ADMIN_PRODUCT_INCLUDE,
    });
    if (!product) throw new NotFoundException(`Product "${id}" not found`);
    return product;
  }

  async create(dto: CreateProductDto) {
    try {
      return await this.prisma.product.create({
        data: {
          slug: dto.slug,
          name: dto.name,
          description: dto.description,
          details: dto.details,
          price: dto.price,
          compareAtPrice: dto.compareAtPrice ?? null,
          categoryId: dto.categoryId,
          isNew: dto.isNew ?? false,
          isBestseller: dto.isBestseller ?? false,
          isOnSale: dto.isOnSale ?? false,
          variants: { create: dto.variants },
        },
        include: ADMIN_PRODUCT_INCLUDE,
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException(
          `A product with slug "${dto.slug}" already exists`,
        );
      }
      throw err;
    }
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findByIdOrThrow(id);
    try {
      return await this.prisma.product.update({
        where: { id },
        data: dto,
        include: ADMIN_PRODUCT_INCLUDE,
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException(
          `A product with slug "${dto.slug}" already exists`,
        );
      }
      throw err;
    }
  }

  async remove(id: string) {
    await this.findByIdOrThrow(id);
    await this.prisma.product.delete({ where: { id } });
  }

  async addVariant(productId: string, dto: AddVariantDto) {
    await this.findByIdOrThrow(productId);
    try {
      await this.prisma.productVariant.create({ data: { productId, ...dto } });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException(
          `A ${dto.color}/${dto.size} variant already exists for this product`,
        );
      }
      throw err;
    }
    return this.findByIdOrThrow(productId);
  }

  async updateVariant(
    productId: string,
    variantId: string,
    dto: UpdateVariantDto,
  ) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
    });
    if (!variant || variant.productId !== productId) {
      throw new NotFoundException('Variant not found on this product');
    }
    await this.prisma.productVariant.update({
      where: { id: variantId },
      data: dto,
    });
    return this.findByIdOrThrow(productId);
  }

  async removeVariant(productId: string, variantId: string) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
    });
    if (!variant || variant.productId !== productId) {
      throw new NotFoundException('Variant not found on this product');
    }
    await this.prisma.productVariant.delete({ where: { id: variantId } });
    return this.findByIdOrThrow(productId);
  }
}
