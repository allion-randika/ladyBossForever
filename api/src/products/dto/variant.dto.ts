import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class AddVariantDto {
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

export class UpdateVariantDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsString()
  colorHex?: string;
}
