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
import { BlogService } from './blog.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { AuditLogService } from '../audit-log/audit-log.service';

@Controller('blog')
export class BlogController {
  constructor(
    private readonly blogService: BlogService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Get()
  findAllPublished() {
    return this.blogService.findAllPublished();
  }

  // Static path declared before the dynamic ":slug" route below, same
  // ordering rule as every other controller in this codebase.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MARKETING_MANAGER')
  @Get('admin/all')
  findAllAdmin() {
    return this.blogService.findAllAdmin();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.blogService.findBySlugPublished(slug);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MARKETING_MANAGER')
  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePostDto,
  ) {
    const post = await this.blogService.create(dto, user.sub);
    await this.auditLog.record(user.sub, 'blog.create', 'BlogPost', post.id, {
      slug: post.slug,
    });
    return post;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MARKETING_MANAGER')
  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
  ) {
    const post = await this.blogService.update(id, dto);
    await this.auditLog.record(user.sub, 'blog.update', 'BlogPost', id, {
      ...dto,
    });
    return post;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MARKETING_MANAGER')
  @Delete(':id')
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    await this.blogService.remove(id);
    await this.auditLog.record(user.sub, 'blog.delete', 'BlogPost', id);
    return { deleted: true };
  }
}
