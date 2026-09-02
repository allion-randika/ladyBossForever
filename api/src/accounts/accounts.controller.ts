import { Controller, Get, UseGuards } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('accounts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ACCOUNTANT')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get('profitability')
  profitability() {
    return this.accountsService.profitability();
  }

  @Get('summary')
  summary() {
    return this.accountsService.summary();
  }
}
