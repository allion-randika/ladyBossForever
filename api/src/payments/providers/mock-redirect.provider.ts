import type { Order } from '@prisma/client';
import type {
  PaymentInitiationResult,
  PaymentProvider,
} from '../payment-provider.interface';

/**
 * Stands in for every real provider until merchant credentials exist.
 * Mirrors the real integration pattern each of the four actually uses
 * (hosted/redirect checkout): the customer is sent to a payment page, then
 * returned to the storefront afterward. Here that "payment page" is our own
 * /checkout/confirm route rather than the provider's, and completing it
 * calls the order's confirm-payment endpoint directly instead of the
 * provider calling a signed webhook — clearly a simulation, not a real charge.
 */
export class MockRedirectProvider implements PaymentProvider {
  constructor(
    public readonly displayName: string,
    private readonly storefrontUrl: string,
  ) {}

  initiate(order: Order): Promise<PaymentInitiationResult> {
    const params = new URLSearchParams({
      orderId: order.id,
      provider: this.displayName,
    });
    return Promise.resolve({
      redirectUrl: `${this.storefrontUrl}/checkout/confirm?${params.toString()}`,
    });
  }
}
