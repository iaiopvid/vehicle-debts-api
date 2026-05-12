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
      // cartao_credito: {
      //   parcelas: [1, 6, 12].map((n) => ({
      //     quantidade: n,
      //     valor_parcela: Number(
      //       (
      //         (baseValue * Math.pow(1.025, n)) / n
      //       ).toFixed(2),
      //     ),
      //   })),
      // },
    };
  }

  private calculateInstallments(valorBase: number) {
    const installments = [];
    const counts = [1, 6, 12];
    const monthlyRate = 0.025;

    for (const n of counts) {
      // let valorParcela: number;
      // if (n === 1) {
      //   valorParcela = valorBase;
      // } else {
      //   valorParcela = (valorBase * Math.pow(1 + monthlyRate, n)) / n;
      // }
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
