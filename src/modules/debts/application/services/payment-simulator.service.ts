import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentSimulatorService {
  simulate(baseValue: number) {
    return {
      pix: {
        total_com_desconto: Number(
          (baseValue * 0.95).toFixed(2),
        ),
      },
      cartao_credito: {
        parcelas: this.calculateInstallments(baseValue),
      },
    };
  }

  private calculateInstallments(valorBase: number) {
    const installments = [];
    const counts = [1, 6, 12];
    const monthlyRate = 0.025;

    for (const n of counts) {
      const valorParcela = n === 1
        ? valorBase
        : (valorBase * Math.pow(1 + monthlyRate, n)) / n;
        
      installments.push({
        quantidade: n,
        valor_parcela: Number(valorParcela.toFixed(2)),
      });
    }

    return installments;
  }
}
