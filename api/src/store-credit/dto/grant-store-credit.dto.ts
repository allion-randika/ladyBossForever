import { IsInt, IsString, Min } from 'class-validator';

export class GrantStoreCreditDto {
  // Grants only — negative corrections are rare enough for MVP that they
  // can go through direct DB access rather than a public endpoint for it.
  @IsInt()
  @Min(1)
  amount!: number;

  @IsString()
  reason!: string;
}
