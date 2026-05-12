import { Injectable } from '@nestjs/common';

import { InterestCalculatorService } from '../services/interest-calculator.service';
import { PaymentSimulatorService } from '../services/payment-simulator.service';
import { ProviderFallbackService } from '../services/provider-fallback.service';
import { ConsultDebtsResponseDto } from './dto/consult-debts-response.dto';
import { PaymentType } from './enums/debt-type.enum';

@Injectable()
export class ConsultDebtsUseCase {
  constructor(
    private readonly providerFallback: ProviderFallbackService,
    private readonly interestCalculator: InterestCalculatorService,
    private readonly paymentSimulator: PaymentSimulatorService,
  ) { }

  async execute(plate: string): Promise<ConsultDebtsResponseDto> {
    const debts = await this.providerFallback.getDebts(plate);

    const updatedDebts = debts.map((debt) =>
      this.interestCalculator.calculate(debt),
    );

    const totalOriginal = updatedDebts.reduce(
      (acc, debt) => acc + debt.originalAmount, 0,
    );

    const totalUpdated = updatedDebts.reduce(
      (acc, debt) => acc + debt.updatedAmount, 0,
    );

    const ipvaTotal = updatedDebts
      .filter((d) => d.type === 'IPVA')
      .reduce((acc, d) => acc + d.updatedAmount, 0);

    const multaTotal = updatedDebts
      .filter((d) => d.type === 'MULTA')
      .reduce((acc, d) => acc + d.updatedAmount, 0);

    return {
      placa: plate,
      debitos: updatedDebts.map((debt) => ({
        tipo: debt.type,
        valor_original: debt.originalAmount,
        valor_atualizado: debt.updatedAmount,
        vencimento: debt.dueDate,
        dias_atraso: debt.delayDays,
      })),
      resumo: {
        total_original: Number(totalOriginal.toFixed(2)),
        total_atualizado: Number(totalUpdated.toFixed(2)),
      },
      pagamentos: {
        opcoes: [
          {
            tipo: PaymentType.TOTAL,
            valor_base: totalUpdated,
            ...this.paymentSimulator.simulate(totalUpdated),
          },
          {
            tipo: PaymentType.SOMENTE_IPVA,
            valor_base: ipvaTotal,
            ...this.paymentSimulator.simulate(ipvaTotal),
          },
          {
            tipo: PaymentType.SOMENTE_MULTAS,
            valor_base: multaTotal,
            ...this.paymentSimulator.simulate(multaTotal),
          },
        ],
      },
    };
  }
}
