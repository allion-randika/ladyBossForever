import { Injectable } from '@nestjs/common';
import type { Order } from '@prisma/client';
import { PaymentMethod } from '@prisma/client';
import { MockRedirectProvider } from './providers/mock-redirect.provider';
import type {
  PaymentInitiationResult,
  PaymentProvider,
} from './payment-provider.interface';

const PROVIDER_DISPLAY_NAMES: Record<PaymentMethod, string> = {
  CARD_PAYHERE: 'PayHere',
  PAYZY: 'Payzy',
  MINTPAY: 'Mintpay',
  KOKO: 'Koko',
};

@Injectable()
export class PaymentsService {
  private readonly storefrontUrl: string;
  private readonly providers: Record<PaymentMethod, PaymentProvider>;

  constructor() {
    this.storefrontUrl = process.env.STOREFRONT_URL ?? 'http://localhost:3000';
    this.providers = {
      CARD_PAYHERE: new MockRedirectProvider(
        PROVIDER_DISPLAY_NAMES.CARD_PAYHERE,
        this.storefrontUrl,
      ),
      PAYZY: new MockRedirectProvider(
        PROVIDER_DISPLAY_NAMES.PAYZY,
        this.storefrontUrl,
      ),
      MINTPAY: new MockRedirectProvider(
        PROVIDER_DISPLAY_NAMES.MINTPAY,
        this.storefrontUrl,
      ),
      KOKO: new MockRedirectProvider(
        PROVIDER_DISPLAY_NAMES.KOKO,
        this.storefrontUrl,
      ),
    };
  }

  initiate(
    order: Order,
    method: PaymentMethod,
  ): Promise<PaymentInitiationResult> {
    return this.providers[method].initiate(order);
  }
}
