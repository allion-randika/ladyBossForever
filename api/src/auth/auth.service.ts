import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { UpdateProfileDto } from './dto/update-profile.dto';
import type { JwtPayload } from './auth.types';

const SALT_ROUNDS = 10;

const PROFILE_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  birthday: true,
  storeCreditBalance: true,
} as const;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly email: EmailService,
  ) {}

  async registerCustomer(dto: RegisterDto) {
    const existing = await this.prisma.customer.findUnique({
      where: { email: dto.email },
    });

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    if (existing) {
      // A customer row with this email but no password means it was
      // created by guest checkout — registering now upgrades that record
      // into a real account instead of being blocked as a duplicate.
      if (existing.passwordHash) {
        throw new ConflictException(
          'An account with this email already exists',
        );
      }
      const upgraded = await this.prisma.customer.update({
        where: { id: existing.id },
        data: {
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
        },
      });
      await this.email.sendWelcome(upgraded.id);
      return this.buildCustomerSession(upgraded.id, upgraded.email);
    }

    const customer = await this.prisma.customer.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
    });

    await this.email.sendWelcome(customer.id);
    return this.buildCustomerSession(customer.id, customer.email);
  }

  async loginCustomer(dto: LoginDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { email: dto.email },
    });
    if (
      !customer ||
      !customer.passwordHash ||
      !(await bcrypt.compare(dto.password, customer.passwordHash))
    ) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.buildCustomerSession(customer.id, customer.email);
  }

  async loginAdmin(dto: LoginDto) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { email: dto.email },
    });
    if (
      !admin ||
      !admin.isActive ||
      !(await bcrypt.compare(dto.password, admin.passwordHash))
    ) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload: JwtPayload = {
      sub: admin.id,
      email: admin.email,
      type: 'admin',
      role: admin.role,
    };

    return {
      accessToken: this.jwt.sign(payload),
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    };
  }

  getProfile(customerId: string) {
    return this.prisma.customer.findUnique({
      where: { id: customerId },
      select: PROFILE_SELECT,
    });
  }

  updateProfile(customerId: string, dto: UpdateProfileDto) {
    return this.prisma.customer.update({
      where: { id: customerId },
      data: { birthday: dto.birthday ? new Date(dto.birthday) : undefined },
      select: PROFILE_SELECT,
    });
  }

  private buildCustomerSession(id: string, email: string) {
    const payload: JwtPayload = { sub: id, email, type: 'customer' };
    return {
      accessToken: this.jwt.sign(payload),
      user: { id, email },
    };
  }
}
