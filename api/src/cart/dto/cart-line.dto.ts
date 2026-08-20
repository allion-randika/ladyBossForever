import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsInt,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CartLineDto {
  @IsString()
  productId!: string;

  @IsString()
  size!: string;

  @IsString()
  color!: string;

  @IsInt()
  @Min(1)
  qty!: number;
}

export class RemoveCartLineDto {
  @IsString()
  productId!: string;

  @IsString()
  size!: string;

  @IsString()
  color!: string;
}

export class SyncCartDto {
  @ValidateNested({ each: true })
  @Type(() => CartLineDto)
  @ArrayMinSize(0)
  lines!: CartLineDto[];
}
