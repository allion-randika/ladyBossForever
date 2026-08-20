import { IsArray, IsString } from 'class-validator';

export class SyncWishlistDto {
  @IsArray()
  @IsString({ each: true })
  productIds!: string[];
}
