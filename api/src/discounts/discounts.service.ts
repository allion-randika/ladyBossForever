import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DiscountType, Prisma, type Discount } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateDiscountDto } from './dto/create-discount.dto';
import type { UpdateDiscountDto } from './dto/update-discount.dto';

export interface DiscountApplication {
  discount: Discount;
  discountAmount: number;
}

@Injectable()
export class DiscountsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.discount.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findByIdOrThrow(id: string) {
    const discount = await this.prisma.discount.findUnique({ where: { id } });
    if (!discount) throw new NotFoundException(`Discount "${id}" not found`);
    return discount;
  }

  async create(dto: CreateDiscountDto) {
    this.assertPercentageInRange(dto.type, dto.value);
    try {
      return await this.prisma.discount.create({
        data: {
          code: dto.code,
          type: dto.type,
          value: dto.value,
          minOrderAmount: dto.minOrderAmount,
          usageLimit: dto.usageLimit,
          startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
          isActive: dto.isActive ?? true,
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException(
          `A discount with code "${dto.code}" already exists`,
        );
      }
      throw err;
    }
  }

  async update(id: string, dto: UpdateDiscountDto) {
    const existing = await this.findByIdOrThrow(id);
    this.assertPercentageInRange(
      dto.type ?? existing.type,
      dto.value ?? existing.value,
    );
    return this.prisma.discount.update({
      where: { id },
      data: {
        type: dto.type,
        value: dto.value,
        minOrderAmount: dto.minOrderAmount,
        usageLimit: dto.usageLimit,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        isActive: dto.isActive,
      },
    });
  }

  async remove(id: string) {
    const discount = await this.findByIdOrThrow(id);
    if (discount.usageCount > 0) {
      throw new ConflictException(
        'This code has already been used on an order and cannot be deleted — deactivate it instead',
      );
    }
    await this.prisma.discount.delete({ where: { id } });
  }

  /**
   * Server-authoritative validation — used both for the storefront's
   * "check this code" preview and, again, at order-creation time. Never
   * trust a client-submitted discount amount.
   */
  async validate(code: string, subtotal: number): Promise<DiscountApplication> {
    const discount = await this.prisma.discount.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
    if (!discount || !discount.isActive) {
      throw new BadRequestException('Invalid discount code');
    }

    const now = new Date();
    if (discount.startsAt && now < discount.startsAt) {
      throw new BadRequestException('This code is not active yet');
    }
    if (discount.expiresAt && now > discount.expiresAt) {
      throw new BadRequestException('This code has expired');
    }
    if (
      discount.usageLimit !== null &&
      discount.usageCount >= discount.usageLimit
    ) {
      throw new BadRequestException('This code has reached its usage limit');
    }
    if (
      discount.minOrderAmount !== null &&
      subtotal < discount.minOrderAmount
    ) {
      throw new BadRequestException(
        `This code requires a minimum order of Rs. ${discount.minOrderAmount}`,
      );
    }

    const discountAmount =
      discount.type === DiscountType.PERCENTAGE
        ? Math.round((subtotal * discount.value) / 100)
        : Math.min(discount.value, subtotal);

    return { discount, discountAmount };
  }

  private assertPercentageInRange(type: DiscountType, value: number) {
    if (type === DiscountType.PERCENTAGE && value > 100) {
      throw new BadRequestException('Percentage discounts cannot exceed 100');
    }
  }
}
