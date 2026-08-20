import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import type { OrderStatus } from '@prisma/client';
import { OrdersService } from './orders.service';
import { CreateGuestOrderDto, CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { AuditLogService } from '../audit-log/audit-log.service';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly auditLog: AuditLogService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(user.sub, dto);
  }

  @Post('guest')
  createGuest(@Body() dto: CreateGuestOrderDto) {
    return this.ordersService.createGuest(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.findAllForCustomer(user.sub);
  }

  // Must come before the ":id" route below — Nest matches GET routes in
  // declaration order, and "admin" would otherwise be swallowed as an :id.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORDER_MANAGER')
  @Get('admin/all')
  findAllAdmin(@Query('status') status?: OrderStatus) {
    return this.ordersService.findAllAdmin(status);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  findOne(
    @Req() req: Request,
    @Param('id') id: string,
    @Query('guestToken') guestToken?: string,
  ) {
    const user = req.user as AuthenticatedUser | undefined;
    return this.ordersService.findOrderForRequester(id, {
      customerId: user?.sub,
      guestToken,
    });
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Post(':id/confirm-payment')
  confirmPayment(
    @Req() req: Request,
    @Param('id') id: string,
    @Query('guestToken') guestToken?: string,
  ) {
    const user = req.user as AuthenticatedUser | undefined;
    return this.ordersService.confirmPayment(id, {
      customerId: user?.sub,
      guestToken,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORDER_MANAGER')
  @Patch(':id/status')
  async updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    const order = await this.ordersService.updateStatus(id, dto.status);
    await this.auditLog.record(user.sub, 'order.status_change', 'Order', id, {
      status: dto.status,
    });
    return order;
  }
}
