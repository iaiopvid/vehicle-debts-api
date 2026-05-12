import { Injectable } from '@nestjs/common';
import { FIXED_CURRENT_DATE } from '../../../../shared/constants/dates';

@Injectable()
export class InterestCalculatorService {
  calculate(debt: any) {
    const dueDate = new Date(debt.dueDate);

    const diffTime =
      FIXED_CURRENT_DATE.getTime() - dueDate.getTime();

    const days =
      Math.floor(diffTime / (1000 * 60 * 60 * 24));

    debt.delayDays = days;

    if (debt.type === 'IPVA') {
      const interest = Math.min(days * 0.0033, 0.2);

      debt.updatedAmount =
        debt.originalAmount * (1 + interest);
    }

    if (debt.type === 'MULTA') {
      const interest = days * 0.01;

      debt.updatedAmount =
        debt.originalAmount * (1 + interest);
    }

    debt.updatedAmount =
      Number(debt.updatedAmount.toFixed(2));

    return debt;
  }
}
