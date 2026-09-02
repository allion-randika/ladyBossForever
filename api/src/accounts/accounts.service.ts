import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const REVENUE_STATUSES = [OrderStatus.PAID, OrderStatus.FULFILLED];

export interface ProductProfit {
  id: string;
  name: string;
  slug: string;
  unitsSold: number;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
  // Units sold whose variant has no costPrice set yet — the cost/profit
  // figures above treat those as zero cost, so this flags how much of the
  // number is actually unknown rather than genuinely free.
  unitsMissingCost: number;
}

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async profitability(): Promise<ProductProfit[]> {
    const items = await this.prisma.orderItem.findMany({
      where: { order: { status: { in: REVENUE_STATUSES } } },
      select: {
        qty: true,
        unitPrice: true,
        productId: true,
        product: { select: { name: true, slug: true } },
        variant: { select: { costPrice: true } },
      },
    });

    const byProduct = new Map<string, ProductProfit>();
    for (const item of items) {
      const entry = byProduct.get(item.productId) ?? {
        id: item.productId,
        name: item.product.name,
        slug: item.product.slug,
        unitsSold: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
        margin: 0,
        unitsMissingCost: 0,
      };
      entry.unitsSold += item.qty;
      entry.revenue += item.unitPrice * item.qty;
      if (item.variant.costPrice === null) {
        entry.unitsMissingCost += item.qty;
      } else {
        entry.cost += item.variant.costPrice * item.qty;
      }
      byProduct.set(item.productId, entry);
    }

    return Array.from(byProduct.values())
      .map((p) => ({
        ...p,
        profit: p.revenue - p.cost,
        margin: p.revenue > 0 ? (p.revenue - p.cost) / p.revenue : 0,
      }))
      .sort((a, b) => b.profit - a.profit);
  }

  async summary() {
    const orders = await this.prisma.order.findMany({
      where: { status: { in: REVENUE_STATUSES } },
      select: {
        total: true,
        items: {
          select: { qty: true, variant: { select: { costPrice: true } } },
        },
      },
    });

    let totalRevenue = 0;
    let totalCOGS = 0;
    let unitsMissingCost = 0;
    for (const order of orders) {
      totalRevenue += order.total;
      for (const item of order.items) {
        if (item.variant.costPrice === null) {
          unitsMissingCost += item.qty;
        } else {
          totalCOGS += item.variant.costPrice * item.qty;
        }
      }
    }

    const expenseAgg = await this.prisma.expense.aggregate({
      _sum: { amount: true },
    });
    const totalExpenses = expenseAgg._sum.amount ?? 0;
    const grossProfit = totalRevenue - totalCOGS;
    const netProfit = grossProfit - totalExpenses;

    return {
      totalRevenue,
      totalCOGS,
      totalExpenses,
      grossProfit,
      netProfit,
      unitsMissingCost,
    };
  }
}
