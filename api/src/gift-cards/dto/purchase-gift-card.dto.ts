import { IsEmail, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class PurchaseGiftCardDto {
  @IsInt()
  @Min(500)
  amount!: number;

  @IsEmail()
  recipientEmail!: string;

  @IsOptional()
  @IsString()
  recipientName?: string;

  @IsOptional()
  @IsString()
  message?: string;
}
