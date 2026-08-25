import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateBannerDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsString()
  ctaLabel!: string;

  @IsString()
  ctaHref!: string;

  @IsOptional()
  @IsInt()
  position?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
