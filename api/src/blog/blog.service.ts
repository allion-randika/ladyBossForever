import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PostStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreatePostDto } from './dto/create-post.dto';
import type { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class BlogService {
  constructor(private readonly prisma: PrismaService) {}

  findAllPublished() {
    return this.prisma.blogPost.findMany({
      where: { status: PostStatus.PUBLISHED },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async findBySlugPublished(slug: string) {
    const post = await this.prisma.blogPost.findUnique({ where: { slug } });
    if (!post || post.status !== PostStatus.PUBLISHED) {
      throw new NotFoundException(`Post "${slug}" not found`);
    }
    return post;
  }

  findAllAdmin() {
    return this.prisma.blogPost.findMany({
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { id: true, name: true } } },
    });
  }

  async create(dto: CreatePostDto, authorId: string) {
    try {
      return await this.prisma.blogPost.create({
        data: {
          ...dto,
          authorId,
          publishedAt: dto.status === PostStatus.PUBLISHED ? new Date() : null,
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException(
          `A post with slug "${dto.slug}" already exists`,
        );
      }
      throw err;
    }
  }

  async update(id: string, dto: UpdatePostDto) {
    const existing = await this.findByIdOrThrow(id);
    return this.prisma.blogPost.update({
      where: { id },
      data: {
        ...dto,
        // First publish stamps the date; later edits (including
        // unpublishing) never move it, so re-publishing doesn't look like
        // a brand-new post.
        publishedAt:
          dto.status === PostStatus.PUBLISHED && !existing.publishedAt
            ? new Date()
            : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findByIdOrThrow(id);
    await this.prisma.blogPost.delete({ where: { id } });
  }

  private async findByIdOrThrow(id: string) {
    const post = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException(`Post "${id}" not found`);
    return post;
  }
}
