import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const CUSTOMER_LIST_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  birthday: true,
  storeCreditBalance: true,
  createdAt: true,
  _count: { select: { orders: true } },
} as const;

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.customer.findMany({
      select: CUSTOMER_LIST_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      select: {
        ...CUSTOMER_LIST_SELECT,
        orders: {
          orderBy: { createdAt: 'desc' },
          include: { items: { include: { product: true, variant: true } } },
        },
      },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }
}
