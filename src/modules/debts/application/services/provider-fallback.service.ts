import { Injectable } from '@nestjs/common';

import { ProviderAAdapter } from '../../infrastructure/providers/provider-a.adapter';
import { ProviderBAdapter } from '../../infrastructure/providers/provider-b.adapter';

@Injectable()
export class ProviderFallbackService {
  constructor(
    private readonly providerA: ProviderAAdapter,
    private readonly providerB: ProviderBAdapter,
  ) {}

  async getDebts(plate: string) {
    try {
      return await this.providerA.getDebts(plate);
    } catch (error) {
      console.log('Provider A failed. Using fallback...');
      return this.providerB.getDebts(plate);
    }
  }
}
