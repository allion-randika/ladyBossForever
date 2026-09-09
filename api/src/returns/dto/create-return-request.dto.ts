import { IsEnum, IsInt, IsString, Min, ValidateIf } from 'class-validator';
import { ReturnType } from '@prisma/client';

export class CreateReturnRequestDto {
  @IsString()
  orderItemId!: string;

  @IsEnum(ReturnType)
  type!: ReturnType;

  @IsInt()
  @Min(1)
  qty!: number;

  @IsString()
  reason!: string;

  @ValidateIf((dto: CreateReturnRequestDto) => dto.type === ReturnType.EXCHANGE)
  @IsString()
  exchangeVariantId?: string;
}
