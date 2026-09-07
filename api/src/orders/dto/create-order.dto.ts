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

  @IsOptional()
  @IsString()
  discountCode?: string;

  @IsOptional()
  @IsString()
  giftCardCode?: string;

  // How much store credit the customer wants to apply, in LKR — their
  // choice, not all-or-nothing. Only meaningful for logged-in checkout;
  // guest orders ignore this even if sent. Re-capped server-side against
  // the real balance and what's still owed — see OrdersService.
  @IsOptional()
  @IsInt()
  @Min(0)
  storeCreditAmount?: number;
}

export class CreateGuestOrderDto extends CreateOrderDto {
  @IsEmail()
  email!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;
}
