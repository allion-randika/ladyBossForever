import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateReviewDto } from './dto/create-review.dto';

const REVIEWER_SELECT = {
  select: { id: true, firstName: true, lastName: true },
} as const;

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findApprovedForProduct(productId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { productId, isApproved: true },
      include: { customer: REVIEWER_SELECT },
      orderBy: { createdAt: 'desc' },
    });

    const count = reviews.length;
    const averageRating = count
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / count
      : 0;

    return { reviews, averageRating, count };
  }

  async create(customerId: string, productId: string, dto: CreateReviewDto) {
    // Only customers who actually bought this product may review it — a
    // completed/paid order containing it is proof of purchase.
    const hasPurchased = await this.prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          customerId,
          status: { in: [OrderStatus.PAID, OrderStatus.FULFILLED] },
        },
      },
    });
    if (!hasPurchased) {
      throw new BadRequestException(
        'You can only review products you have purchased',
      );
    }

    try {
      return await this.prisma.review.create({
        data: { productId, customerId, ...dto },
        include: { customer: REVIEWER_SELECT },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException('You have already reviewed this product');
      }
      throw err;
    }
  }

  findPending() {
    return this.prisma.review.findMany({
      where: { isApproved: false },
      include: {
        customer: REVIEWER_SELECT,
        product: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async approve(id: string) {
    await this.findByIdOrThrow(id);
    return this.prisma.review.update({
      where: { id },
      data: { isApproved: true },
    });
  }

  async remove(id: string) {
    await this.findByIdOrThrow(id);
    await this.prisma.review.delete({ where: { id } });
  }

  private async findByIdOrThrow(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException(`Review "${id}" not found`);
    return review;
  }
}
