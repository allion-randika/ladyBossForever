import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { EmailProvider, SendEmailInput } from '../email.types';

/**
 * Stands in for a real provider (Resend/SES) until one is wired in — no
 * self-serve sandbox needed, unlike the payment providers, but there's
 * still no live measurement/API key to send through yet. Records what
 * would have been sent instead, which doubles as the admin-visible proof
 * the automation actually fired.
 */
export class MockEmailProvider implements EmailProvider {
  constructor(private readonly prisma: PrismaService) {}

  async send(input: SendEmailInput): Promise<void> {
    await this.prisma.emailLog.create({
      data: {
        type: input.type,
        to: input.to,
        subject: input.subject,
        customerId: input.customerId,
        metadata: input.metadata as Prisma.InputJsonValue,
      },
    });
  }
}
