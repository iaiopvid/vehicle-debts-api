import { Module } from '@nestjs/common';

import { DebtsController } from './presentation/debts.controller';
import { ConsultDebtsUseCase } from './application/use-cases/consult-debts.usecase';
import { InterestCalculatorService } from './application/services/interest-calculator.service';
import { PaymentSimulatorService } from './application/services/payment-simulator.service';
import { ProviderFallbackService } from './application/services/provider-fallback.service';
import { ProviderAAdapter } from './infrastructure/providers/provider-a.adapter';
import { ProviderBAdapter } from './infrastructure/providers/provider-b.adapter';

@Module({
  controllers: [DebtsController],
  providers: [
    ConsultDebtsUseCase,
    InterestCalculatorService,
    PaymentSimulatorService,
    ProviderFallbackService,
    ProviderAAdapter,
    ProviderBAdapter,
  ],
})
export class DebtsModule {}
