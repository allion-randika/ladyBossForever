import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import {
  CartLineDto,
  RemoveCartLineDto,
  SyncCartDto,
} from './dto/cart-line.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.cartService.findAllForCustomer(user.sub);
  }

  @Post()
  addOrIncrement(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CartLineDto,
  ) {
    return this.cartService.addOrIncrement(user.sub, dto);
  }

  @Put()
  setQty(@CurrentUser() user: AuthenticatedUser, @Body() dto: CartLineDto) {
    return this.cartService.setQty(user.sub, dto);
  }

  @Post('sync')
  sync(@CurrentUser() user: AuthenticatedUser, @Body() dto: SyncCartDto) {
    return this.cartService.sync(user.sub, dto.lines);
  }

  @Delete('line')
  removeLine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: RemoveCartLineDto,
  ) {
    return this.cartService.remove(user.sub, query);
  }

  @Delete()
  clear(@CurrentUser() user: AuthenticatedUser) {
    return this.cartService.clear(user.sub);
  }
}
