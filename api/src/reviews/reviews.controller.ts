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
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { AuditLogService } from '../audit-log/audit-log.service';

@Controller('reviews')
export class ReviewsController {
  constructor(
    private readonly reviewsService: ReviewsService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Get('product/:productId')
  findForProduct(@Param('productId') productId: string) {
    return this.reviewsService.findApprovedForProduct(productId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('product/:productId')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('productId') productId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(user.sub, productId, dto);
  }

  // Must come before ":id" routes below — same static-before-dynamic
  // ordering NestJS needs everywhere else in this codebase.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MARKETING_MANAGER')
  @Get('pending')
  findPending() {
    return this.reviewsService.findPending();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MARKETING_MANAGER')
  @Patch(':id/approve')
  async approve(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    const review = await this.reviewsService.approve(id);
    await this.auditLog.record(user.sub, 'review.approve', 'Review', id);
    return review;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MARKETING_MANAGER')
  @Delete(':id')
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    await this.reviewsService.remove(id);
    await this.auditLog.record(user.sub, 'review.remove', 'Review', id);
    return { deleted: true };
  }
}
