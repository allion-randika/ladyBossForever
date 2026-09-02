import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateExpenseDto } from './dto/create-expense.dto';
import type { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.expense.findMany({ orderBy: { incurredAt: 'desc' } });
  }

  create(dto: CreateExpenseDto) {
    return this.prisma.expense.create({
      data: {
        ...dto,
        incurredAt: dto.incurredAt ? new Date(dto.incurredAt) : undefined,
      },
    });
  }

  async update(id: string, dto: UpdateExpenseDto) {
    await this.findByIdOrThrow(id);
    return this.prisma.expense.update({
      where: { id },
      data: {
        ...dto,
        incurredAt: dto.incurredAt ? new Date(dto.incurredAt) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findByIdOrThrow(id);
    await this.prisma.expense.delete({ where: { id } });
  }

  private async findByIdOrThrow(id: string) {
    const expense = await this.prisma.expense.findUnique({ where: { id } });
    if (!expense) throw new NotFoundException(`Expense "${id}" not found`);
    return expense;
  }
}
