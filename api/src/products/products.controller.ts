import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { QueryProductsDto } from './dto/query-products.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AddVariantDto, UpdateVariantDto } from './dto/variant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { AuditLogService } from '../audit-log/audit-log.service';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Get()
  findAll(@Query() query: QueryProductsDto) {
    return this.productsService.findAll(query);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INVENTORY_MANAGER')
  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProductDto,
  ) {
    const product = await this.productsService.create(dto);
    await this.auditLog.record(
      user.sub,
      'product.create',
      'Product',
      product.id,
      { slug: product.slug },
    );
    return product;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INVENTORY_MANAGER')
  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    const product = await this.productsService.update(id, dto);
    await this.auditLog.record(user.sub, 'product.update', 'Product', id, {
      changes: { ...dto },
    });
    return product;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INVENTORY_MANAGER')
  @Delete(':id')
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    await this.productsService.remove(id);
    await this.auditLog.record(user.sub, 'product.delete', 'Product', id);
    return { deleted: true };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INVENTORY_MANAGER')
  @Post(':id/variants')
  async addVariant(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AddVariantDto,
  ) {
    const product = await this.productsService.addVariant(id, dto);
    await this.auditLog.record(
      user.sub,
      'product.variant.create',
      'Product',
      id,
      { ...dto },
    );
    return product;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INVENTORY_MANAGER')
  @Patch(':id/variants/:variantId')
  async updateVariant(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateVariantDto,
  ) {
    const product = await this.productsService.updateVariant(
      id,
      variantId,
      dto,
    );
    await this.auditLog.record(
      user.sub,
      'product.variant.update',
      'Product',
      id,
      { variantId, changes: { ...dto } },
    );
    return product;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INVENTORY_MANAGER')
  @Delete(':id/variants/:variantId')
  async removeVariant(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('variantId') variantId: string,
  ) {
    const product = await this.productsService.removeVariant(id, variantId);
    await this.auditLog.record(
      user.sub,
      'product.variant.delete',
      'Product',
      id,
      { variantId },
    );
    return product;
  }
}
