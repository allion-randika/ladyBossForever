import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { MarketingService } from './marketing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { AuditLogService } from '../audit-log/audit-log.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('marketing')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MARKETING_MANAGER')
export class MarketingController {
  constructor(
    private readonly marketing: MarketingService,
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  // Proof the automation actually fired, since nothing is really sent yet —
  // see EmailModule's MockEmailProvider.
  @Get('email-log')
  emailLog() {
    return this.prisma.emailLog.findMany({
      take: 200,
      orderBy: { sentAt: 'desc' },
      include: { customer: { select: { firstName: true, lastName: true } } },
    });
  }

  @Post('run-abandoned-cart-check')
  async runAbandonedCartCheck(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.marketing.runAbandonedCartCheck();
    await this.auditLog.record(
      user.sub,
      'marketing.abandoned_cart_check',
      'System',
      'manual-trigger',
      result,
    );
    return result;
  }
}
