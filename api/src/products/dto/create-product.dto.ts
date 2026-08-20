import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class ProductVariantInput {
  @IsString()
  size!: string;

  @IsString()
  color!: string;

  @IsString()
  colorHex!: string;

  @IsInt()
  @Min(0)
  stock!: number;
}

export class CreateProductDto {
  @IsString()
  slug!: string;

  @IsString()
  name!: string;

  @IsString()
  description!: string;

  @IsArray()
  @IsString({ each: true })
  details!: string[];

  @IsInt()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  compareAtPrice?: number;

  @IsString()
  categoryId!: string;

  @IsOptional()
  @IsBoolean()
  isNew?: boolean;

  @IsOptional()
  @IsBoolean()
  isBestseller?: boolean;

  @IsOptional()
  @IsBoolean()
  isOnSale?: boolean;

  @ValidateNested({ each: true })
  @Type(() => ProductVariantInput)
  @ArrayMinSize(1)
  variants!: ProductVariantInput[];
}
