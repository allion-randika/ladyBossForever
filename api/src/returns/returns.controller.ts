import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { ReturnStatus } from '@prisma/client';
import { ReturnsService } from './returns.service';
import { CreateReturnRequestDto } from './dto/create-return-request.dto';
import { DecideReturnRequestDto } from './dto/decide-return-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { AuditLogService } from '../audit-log/audit-log.service';

@Controller('returns')
export class ReturnsController {
  constructor(
    private readonly returns: ReturnsService,
    private readonly auditLog: AuditLogService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  requestReturn(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateReturnRequestDto,
  ) {
    return this.returns.requestReturn(user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.returns.findAllForCustomer(user.sub);
  }

  // Must come before ":id" — Nest matches GET routes in declaration order.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORDER_MANAGER')
  @Get('admin/all')
  findAllAdmin(@Query('status') status?: ReturnStatus) {
    return this.returns.findAllAdmin(status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORDER_MANAGER')
  @Patch(':id/decide')
  async decide(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: DecideReturnRequestDto,
  ) {
    const result = await this.returns.decide(id, dto);
    await this.auditLog.record(user.sub, 'return.decide', 'ReturnRequest', id, {
      decision: dto.decision,
    });
    return result;
  }
}
