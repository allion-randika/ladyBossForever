import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PostStatus } from '@prisma/client';

export class CreatePostDto {
  @IsString()
  slug!: string;

  @IsString()
  title!: string;

  @IsString()
  excerpt!: string;

  @IsString()
  body!: string;

  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;
}
