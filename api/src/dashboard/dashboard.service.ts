import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const REVENUE_STATUSES: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.FULFILLED,
];

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      revenueAgg,
      orderCount,
      todayOrderCount,
      pendingCount,
      topProductRows,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        where: { status: { in: REVENUE_STATUSES } },
        _sum: { total: true },
      }),
      this.prisma.order.count(),
      this.prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      this.prisma.orderItem.groupBy({
        by: ['productId'],
        where: { order: { status: { in: REVENUE_STATUSES } } },
        _sum: { qty: true },
        orderBy: { _sum: { qty: 'desc' } },
        take: 5,
      }),
    ]);

    const products = await this.prisma.product.findMany({
      where: { id: { in: topProductRows.map((r) => r.productId) } },
      select: { id: true, name: true, slug: true, price: true },
    });
    const productById = new Map(products.map((p) => [p.id, p]));

    const topProducts = topProductRows
      .map((row) => {
        const product = productById.get(row.productId);
        if (!product) return null;
        return { ...product, unitsSold: row._sum.qty ?? 0 };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    return {
      totalRevenue: revenueAgg._sum.total ?? 0,
      orderCount,
      todayOrderCount,
      pendingOrderCount: pendingCount,
      topProducts,
    };
  }
}
