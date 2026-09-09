import type { EmailType } from '@prisma/client';

export interface SendEmailInput {
  type: EmailType;
  to: string;
  subject: string;
  customerId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * One implementation to eventually swap in a real provider (Resend, SES).
 * Mirrors PaymentProvider's seam: everything above this interface doesn't
 * need to change when a real provider is dropped in.
 */
export interface EmailProvider {
  send(input: SendEmailInput): Promise<void>;
}
