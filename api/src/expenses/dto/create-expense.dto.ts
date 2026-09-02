import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ExpenseCategory } from '@prisma/client';

export class CreateExpenseDto {
  @IsEnum(ExpenseCategory)
  category!: ExpenseCategory;

  @IsString()
  description!: string;

  @IsInt()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsDateString()
  incurredAt?: string;
}
