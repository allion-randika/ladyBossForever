import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from './auth.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.registerCustomer(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.loginCustomer(dto);
  }

  @Post('admin/login')
  adminLogin(@Body() dto: LoginDto) {
    return this.authService.loginAdmin(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  // Proves the RBAC chain end-to-end: only INVENTORY_MANAGER (or SUPER_ADMIN,
  // which bypasses per RolesGuard) may call this. Real inventory-management
  // routes arrive in the Phase 4 admin panel.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INVENTORY_MANAGER')
  @Get('admin/whoami')
  adminWhoAmI(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
}
