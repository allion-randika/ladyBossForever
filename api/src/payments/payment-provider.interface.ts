import type { Order } from '@prisma/client';

export interface PaymentInitiationResult {
  redirectUrl: string;
}

/**
 * One implementation per real provider (PayHere, Payzy, Mintpay, Koko) is
 * meant to live behind this interface. Every one of the four requires
 * merchant registration with no self-serve sandbox (confirmed during the
 * Phase 0 discovery spike, 3-5+ business days each) — so today they're all
 * backed by MockRedirectProvider. OrdersService and everything above this
 * interface doesn't need to change when a real provider is dropped in.
 */
export interface PaymentProvider {
  readonly displayName: string;
  initiate(order: Order): Promise<PaymentInitiationResult>;
}
