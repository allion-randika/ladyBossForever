import { IsDateString, IsOptional } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsDateString()
  birthday?: string;
}
