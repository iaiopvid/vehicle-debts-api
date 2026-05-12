import { DebtEntity } from '../entities/debt.entity';

export interface DebtProvider {
  getDebts(plate: string): Promise<DebtEntity[]>;
}
