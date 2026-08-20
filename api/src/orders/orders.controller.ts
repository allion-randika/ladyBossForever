import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { OrdersService } from './orders.service';
import { CreateGuestOrderDto, CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

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
}
