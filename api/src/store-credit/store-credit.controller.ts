import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { StoreCreditService } from './store-credit.service';
import { GrantStoreCreditDto } from './dto/grant-store-credit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { AuditLogService } from '../audit-log/audit-log.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('store-credit')
export class StoreCreditController {
  constructor(
    private readonly storeCreditService: StoreCreditService,
    private readonly auditLog: AuditLogService,
    private readonly prisma: PrismaService,
  ) {}

  // Customer-facing — own balance and ledger, for the account page.
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async myLedger(@CurrentUser() user: AuthenticatedUser) {
    if (user.type !== 'customer') {
      throw new ForbiddenException('Customer account required');
    }
    const [customer, transactions] = await Promise.all([
      this.prisma.customer.findUnique({
        where: { id: user.sub },
        select: { storeCreditBalance: true },
      }),
      this.storeCreditService.getLedger(user.sub),
    ]);
    return { balance: customer?.storeCreditBalance ?? 0, transactions };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ACCOUNTANT')
  @Get('customers/:customerId')
  async customerLedger(@Param('customerId') customerId: string) {
    const [customer, transactions] = await Promise.all([
      this.prisma.customer.findUnique({
        where: { id: customerId },
        select: { storeCreditBalance: true },
      }),
      this.storeCreditService.getLedger(customerId),
    ]);
    return { balance: customer?.storeCreditBalance ?? 0, transactions };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ACCOUNTANT')
  @Post('customers/:customerId/grant')
  async grant(
    @CurrentUser() user: AuthenticatedUser,
    @Param('customerId') customerId: string,
    @Body() dto: GrantStoreCreditDto,
  ) {
    const customer = await this.storeCreditService.grant(
      customerId,
      dto.amount,
      dto.reason,
    );
    await this.auditLog.record(
      user.sub,
      'store_credit.grant',
      'Customer',
      customerId,
      { amount: dto.amount, reason: dto.reason },
    );
    return customer;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ACCOUNTANT')
  @Post('run-birthday-check')
  async runBirthdayCheck(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.storeCreditService.runBirthdayCheck();
    await this.auditLog.record(
      user.sub,
      'store_credit.birthday_check',
      'System',
      'manual-trigger',
      result,
    );
    return result;
  }
}
