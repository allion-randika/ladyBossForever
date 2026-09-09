import { IsIn, IsOptional, IsString } from 'class-validator';

export class DecideReturnRequestDto {
  @IsIn(['APPROVE', 'REJECT'])
  decision!: 'APPROVE' | 'REJECT';

  @IsOptional()
  @IsString()
  adminNote?: string;
}
