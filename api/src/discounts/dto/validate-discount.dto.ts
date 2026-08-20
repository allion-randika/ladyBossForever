import { IsInt, IsString, Min } from 'class-validator';

export class ValidateDiscountDto {
  @IsString()
  code!: string;

  @IsInt()
  @Min(0)
  subtotal!: number;
}
