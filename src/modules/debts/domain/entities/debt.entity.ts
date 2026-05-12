import { DebtType } from '../enums/debt-type.enum';

export class DebtEntity {
  type: DebtType;
  originalAmount: number;
  updatedAmount: number;
  dueDate: string;
  delayDays: number;
}
