import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { AuditLogService } from '../audit-log/audit-log.service';

@Controller('expenses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ACCOUNTANT')
export class ExpensesController {
  constructor(
    private readonly expensesService: ExpensesService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Get()
  findAll() {
    return this.expensesService.findAll();
  }

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateExpenseDto,
  ) {
    const expense = await this.expensesService.create(dto);
    await this.auditLog.record(
      user.sub,
      'expense.create',
      'Expense',
      expense.id,
      { category: expense.category, amount: expense.amount },
    );
    return expense;
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    const expense = await this.expensesService.update(id, dto);
    await this.auditLog.record(user.sub, 'expense.update', 'Expense', id, {
      ...dto,
    });
    return expense;
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    await this.expensesService.remove(id);
    await this.auditLog.record(user.sub, 'expense.delete', 'Expense', id);
    return { deleted: true };
  }
}
