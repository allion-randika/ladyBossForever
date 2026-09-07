import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
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

  // Self-service profile fields — currently just birthday, since that's
  // what the loyalty birthday bonus needs. Admin tokens have no customer
  // row to update, so they're rejected explicitly rather than hitting a
  // confusing "not found" from Prisma.
  @UseGuards(JwtAuthGuard)
  @Get('me/profile')
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    if (user.type !== 'customer') {
      throw new ForbiddenException('Customer account required');
    }
    return this.authService.getProfile(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/profile')
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    if (user.type !== 'customer') {
      throw new ForbiddenException('Customer account required');
    }
    return this.authService.updateProfile(user.sub, dto);
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
