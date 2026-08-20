import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { DiscountType } from '@prisma/client';

export class CreateDiscountDto {
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{3,32}$/, {
    message: 'Code must be 3-32 letters, numbers, hyphens or underscores',
  })
  @Transform(({ value }: { value: string }) => value.toUpperCase())
  code!: string;

  @IsEnum(DiscountType)
  type!: DiscountType;

  @IsInt()
  @Min(1)
  value!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minOrderAmount?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimit?: number;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// class-validator can't express "value <= 100 only when type is
// PERCENTAGE" as a per-field decorator, so that cross-field check happens
// in DiscountsService instead.
