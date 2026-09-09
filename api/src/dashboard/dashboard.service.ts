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

  /**
   * Best-selling size/colour combos per category, and an overall return
   * rate — all derivable from order data already in the database. Deliberately
   * not product-view or add-to-cart funnel tracking: that needs new event
   * logging infrastructure, which Phase 6 already decided to defer to a
   * pluggable analytics layer (GA4/PostHog) rather than roll in-house.
   */
  async getMerchandising() {
    const [soldItems, returnedAgg, totalSoldAgg] = await Promise.all([
      this.prisma.orderItem.findMany({
        where: { order: { status: { in: REVENUE_STATUSES } } },
        select: {
          qty: true,
          variant: {
            select: {
              size: true,
              color: true,
              product: {
                select: {
                  category: { select: { slug: true, label: true } },
                },
              },
            },
          },
        },
      }),
      this.prisma.returnRequest.aggregate({
        where: { status: { in: ['REFUNDED', 'EXCHANGED'] } },
        _sum: { qty: true },
      }),
      this.prisma.orderItem.aggregate({
        where: { order: { status: { in: REVENUE_STATUSES } } },
        _sum: { qty: true },
      }),
    ]);

    const byCategory = new Map<
      string,
      { label: string; combos: Map<string, number> }
    >();
    for (const item of soldItems) {
      const { slug, label } = item.variant.product.category;
      const comboKey = `${item.variant.color} / ${item.variant.size}`;
      if (!byCategory.has(slug)) {
        byCategory.set(slug, { label, combos: new Map() });
      }
      const entry = byCategory.get(slug)!;
      entry.combos.set(comboKey, (entry.combos.get(comboKey) ?? 0) + item.qty);
    }

    const bestSellingByCategory = Array.from(byCategory.entries())
      .map(([slug, { label, combos }]) => ({
        slug,
        label,
        topCombos: Array.from(combos.entries())
          .map(([combo, unitsSold]) => ({ combo, unitsSold }))
          .sort((a, b) => b.unitsSold - a.unitsSold)
          .slice(0, 3),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    const totalSold = totalSoldAgg._sum.qty ?? 0;
    const totalReturned = returnedAgg._sum.qty ?? 0;

    return {
      bestSellingByCategory,
      returnRate: totalSold > 0 ? totalReturned / totalSold : 0,
      totalSold,
      totalReturned,
    };
  }
}
