import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class OrderItemInput {
  @IsString()
  productId!: string;

  @IsString()
  variantId!: string;

  @IsInt()
  @Min(1)
  qty!: number;
}

export class ShippingAddressInput {
  @IsString()
  line1!: string;

  @IsOptional()
  @IsString()
  line2?: string;

  @IsString()
  city!: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsString()
  phone!: string;
}

export class CreateOrderDto {
  @ValidateNested({ each: true })
  @Type(() => OrderItemInput)
  @ArrayMinSize(1)
  items!: OrderItemInput[];

  @ValidateNested()
  @Type(() => ShippingAddressInput)
  shippingAddress!: ShippingAddressInput;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;
}

export class CreateGuestOrderDto extends CreateOrderDto {
  @IsEmail()
  email!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;
}
