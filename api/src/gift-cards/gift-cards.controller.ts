import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { GiftCardsService } from './gift-cards.service';
import { PurchaseGiftCardDto } from './dto/purchase-gift-card.dto';
import { IssueGiftCardDto } from './dto/issue-gift-card.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { AuditLogService } from '../audit-log/audit-log.service';

@Controller('gift-cards')
export class GiftCardsController {
  constructor(
    private readonly giftCardsService: GiftCardsService,
    private readonly auditLog: AuditLogService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('purchase')
  purchase(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: PurchaseGiftCardDto,
  ) {
    return this.giftCardsService.purchase(user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.giftCardsService.findMine(user.sub);
  }

  // Static paths declared before the dynamic ":code" route below, same
  // ordering rule as every other controller in this codebase.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ACCOUNTANT')
  @Get('admin/all')
  findAllAdmin() {
    return this.giftCardsService.findAllAdmin();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ACCOUNTANT')
  @Post('admin/issue')
  async issue(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: IssueGiftCardDto,
  ) {
    const giftCard = await this.giftCardsService.issue(user.sub, dto);
    await this.auditLog.record(
      user.sub,
      'gift_card.issue',
      'GiftCard',
      giftCard.id,
      { amount: dto.amount, recipientEmail: dto.recipientEmail },
    );
    return giftCard;
  }

  // Public — checking a card's remaining balance needs no auth beyond
  // knowing the code, same as redeeming one.
  @Get(':code')
  findByCode(@Param('code') code: string) {
    return this.giftCardsService.findByCode(code);
  }
}
