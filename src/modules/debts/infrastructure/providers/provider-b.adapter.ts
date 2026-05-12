import { Injectable } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';
import { DebtProvider } from '../../domain/interfaces/debt-provider.interface';
import { providerBMock } from '../mocks/provider-b.mock';
import { DebtEntity } from '../../domain/entities/debt.entity';
import { DebtType } from '../../domain/enums/debt-type.enum';

@Injectable()
export class ProviderBAdapter implements DebtProvider {
  private shouldFail: boolean = false

  async getDebts(plate: string): Promise<DebtEntity[]> {
    const parser = new XMLParser();

    const parsed = parser.parse(providerBMock);

    return parsed.response.debts.debt.map((debt): DebtEntity => ({
      type: debt.category as DebtType,
      originalAmount: Number(debt.value),
      updatedAmount: Number(debt.value),
      dueDate: debt.expiration,
      delayDays: 0,
    }));
  }

  public setSimulateShouldFail(yesno: boolean) {
    this.shouldFail = yesno;
  }
}
