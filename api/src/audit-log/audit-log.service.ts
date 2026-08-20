import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '@prisma/client';

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  record(
    adminId: string,
    action: string,
    targetType: string,
    targetId: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    // Fire-and-forget from the caller's perspective, but never silently
    // swallow a write failure — that would make the audit trail lie by
    // omission. Callers await this; if it throws, the mutation it's
    // logging should be treated as failed too.
    return this.prisma.auditLog.create({
      data: { adminId, action, targetType, targetId, metadata },
    });
  }

  findAll(limit = 100) {
    return this.prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        admin: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  }
}
