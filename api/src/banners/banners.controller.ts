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
import { BannersService } from './banners.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { AuditLogService } from '../audit-log/audit-log.service';

@Controller('banners')
export class BannersController {
  constructor(
    private readonly bannersService: BannersService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Get()
  findActive() {
    return this.bannersService.findActive();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MARKETING_MANAGER')
  @Get('admin/all')
  findAllAdmin() {
    return this.bannersService.findAllAdmin();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MARKETING_MANAGER')
  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBannerDto,
  ) {
    const banner = await this.bannersService.create(dto);
    await this.auditLog.record(user.sub, 'banner.create', 'Banner', banner.id, {
      title: banner.title,
    });
    return banner;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MARKETING_MANAGER')
  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateBannerDto,
  ) {
    const banner = await this.bannersService.update(id, dto);
    await this.auditLog.record(user.sub, 'banner.update', 'Banner', id, {
      ...dto,
    });
    return banner;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MARKETING_MANAGER')
  @Delete(':id')
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    await this.bannersService.remove(id);
    await this.auditLog.record(user.sub, 'banner.delete', 'Banner', id);
    return { deleted: true };
  }
}
