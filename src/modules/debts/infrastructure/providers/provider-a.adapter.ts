import { Injectable } from '@nestjs/common';
import { DebtProvider } from '../../domain/interfaces/debt-provider.interface';
import { providerAMock } from '../mocks/provider-a.mock';
import { DebtEntity } from '../../domain/entities/debt.entity';
import { DebtType } from '../../domain/enums/debt-type.enum';

@Injectable()
export class ProviderAAdapter implements DebtProvider {
  private shouldFail: boolean = true

  async getDebts(plate: string): Promise<DebtEntity[]> {
    if (this.shouldFail) {
      throw new Error('Provider A timeout');
    }

    return providerAMock.debts.map((debt): DebtEntity => ({
      type: debt.type as DebtType,
      originalAmount: debt.amount,
      updatedAmount: debt.amount,
      dueDate: debt.due_date,
      delayDays: 0,
    }));
  }

  public setSimulateShouldFail(yesno: boolean) {
    this.shouldFail = yesno;
  }
}
