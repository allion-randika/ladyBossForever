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
import { DiscountsService } from './discounts.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { ValidateDiscountDto } from './dto/validate-discount.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { AuditLogService } from '../audit-log/audit-log.service';

@Controller('discounts')
export class DiscountsController {
  constructor(
    private readonly discountsService: DiscountsService,
    private readonly auditLog: AuditLogService,
  ) {}

  // Public — both guest and logged-in checkout need to check a code before
  // an order exists to attach it to.
  @Post('validate')
  async validate(@Body() dto: ValidateDiscountDto) {
    const { discount, discountAmount } = await this.discountsService.validate(
      dto.code,
      dto.subtotal,
    );
    return {
      code: discount.code,
      type: discount.type,
      value: discount.value,
      discountAmount,
      total: dto.subtotal - discountAmount,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MARKETING_MANAGER')
  @Get()
  findAll() {
    return this.discountsService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MARKETING_MANAGER')
  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDiscountDto,
  ) {
    const discount = await this.discountsService.create(dto);
    await this.auditLog.record(
      user.sub,
      'discount.create',
      'Discount',
      discount.id,
      {
        code: discount.code,
      },
    );
    return discount;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MARKETING_MANAGER')
  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateDiscountDto,
  ) {
    const discount = await this.discountsService.update(id, dto);
    await this.auditLog.record(user.sub, 'discount.update', 'Discount', id, {
      ...dto,
    });
    return discount;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MARKETING_MANAGER')
  @Delete(':id')
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    await this.discountsService.remove(id);
    await this.auditLog.record(user.sub, 'discount.delete', 'Discount', id);
    return { deleted: true };
  }
}
