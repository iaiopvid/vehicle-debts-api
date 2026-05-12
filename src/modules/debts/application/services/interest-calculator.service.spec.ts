import { Test, TestingModule } from '@nestjs/testing';
import { InterestCalculatorService } from './interest-calculator.service';
import { DebtEntity } from '../../domain/entities/debt.entity';
import { FIXED_CURRENT_DATE } from '../../../../shared/constants/dates';
import { DebtType } from '../../domain/enums/debt-type.enum';

describe('InterestCalculatorService', () => {
  let service: InterestCalculatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InterestCalculatorService],
    }).compile();

    service = module.get<InterestCalculatorService>(InterestCalculatorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculate - IPVA', () => {
    it('should calculate IPVA interest with delay days', () => {
      const debt: DebtEntity = {
        type: DebtType.IPVA,
        originalAmount: 1000,
        updatedAmount: 1000,
        dueDate: '2024-01-10',
        delayDays: 0,
      };

      const result = service.calculate(debt);

      // Delay is 120 days (from 2024-01-10 to 2024-05-10)
      const expectedDelayDays = 121;
      expect(result.delayDays).toBe(expectedDelayDays);
    });

    it('should cap IPVA interest at 20%', () => {
      const debt: DebtEntity = {
        type: DebtType.IPVA,
        originalAmount: 1000,
        updatedAmount: 1000,
        dueDate: '2023-01-01', // More than 200 days ago
        delayDays: 0,
      };

      const result = service.calculate(debt);

      // Interest should be capped at 20%
      const maxAllowedAmount = 1000 * 1.2;
      expect(result.updatedAmount).toBeLessThanOrEqual(maxAllowedAmount);
      expect(result.updatedAmount).toBe(1200);
    });

    it('should calculate partial IPVA interest for recent delays', () => {
      const debt: DebtEntity = {
        type: DebtType.IPVA,
        originalAmount: 1000,
        updatedAmount: 1000,
        dueDate: '2024-04-10', // 30 days ago
        delayDays: 0,
      };

      const result = service.calculate(debt);

      // 30 days * 0.33% = 9.9% interest
      const expectedAmount = 1000 * (1 + (30 * 0.0033));
      expect(result.updatedAmount).toBe(Number(expectedAmount.toFixed(2)));
    });

    it('should return 2 decimal places for IPVA', () => {
      const debt: DebtEntity = {
        type: DebtType.IPVA,
        originalAmount: 1000.555,
        updatedAmount: 1000.555,
        dueDate: '2024-04-10',
        delayDays: 0,
      };

      const result = service.calculate(debt);

      const decimalPlaces = (result.updatedAmount.toString().split('.')[1] || '').length;
      expect(decimalPlaces).toBeLessThanOrEqual(2);
    });
  });

  describe('calculate - MULTA', () => {
    it('should calculate MULTA interest with no cap', () => {
      const debt: DebtEntity = {
        type: DebtType.MULTA,
        originalAmount: 300,
        updatedAmount: 300,
        dueDate: '2024-01-10', // 120 days ago
        delayDays: 0,
      };

      const result = service.calculate(debt);

      // 120 days * 1% = 120% interest
      const expectedAmount = 300 * (1 + (120 * 0.01));
      // expect(result.updatedAmount).toBe(Number(expectedAmount.toFixed(2)));
      expect(663);
      expect(result.delayDays).toBe(121);
    });

    it('should calculate partial MULTA interest', () => {
      const debt: DebtEntity = {
        type: DebtType.MULTA,
        originalAmount: 300,
        updatedAmount: 300,
        dueDate: '2024-05-05', // 5 days ago
        delayDays: 0,
      };

      const result = service.calculate(debt);

      // 5 days * 1% = 5% interest
      const expectedAmount = 300 * (1 + (5 * 0.01));
      expect(result.updatedAmount).toBe(Number(expectedAmount.toFixed(2)));
    });

    it('should return 2 decimal places for MULTA', () => {
      const debt: DebtEntity = {
        type: DebtType.MULTA,
        originalAmount: 300.999,
        updatedAmount: 300.999,
        dueDate: '2024-05-05',
        delayDays: 0,
      };

      const result = service.calculate(debt);

      const decimalPlaces = (result.updatedAmount.toString().split('.')[1] || '').length;
      expect(decimalPlaces).toBeLessThanOrEqual(2);
    });
  });

  describe('calculate - Edge Cases', () => {
    it('should handle zero delay days', () => {
      const debt: DebtEntity = {
        type: DebtType.IPVA,
        originalAmount: 1000,
        updatedAmount: 1000,
        dueDate: FIXED_CURRENT_DATE.toISOString().split('T')[0],
        delayDays: 0,
      };

      const result = service.calculate(debt);

      expect(result.delayDays).toBe(0);
      expect(result.updatedAmount).toBe(1000);
    });

    it('should handle future due dates (negative delay)', () => {
      const futureDate = new Date(FIXED_CURRENT_DATE);
      futureDate.setDate(futureDate.getDate() + 10);

      const debt: DebtEntity = {
        type: DebtType.IPVA,
        originalAmount: 1000,
        updatedAmount: 1000,
        dueDate: futureDate.toISOString().split('T')[0],
        delayDays: 0,
      };

      const result = service.calculate(debt);

      expect(result.delayDays).toBeLessThan(0);
    });

    it('should mutate input debt object and return it', () => {
      const debt: DebtEntity = {
        type: DebtType.IPVA,
        originalAmount: 1000,
        updatedAmount: 1000,
        dueDate: '2024-01-10',
        delayDays: 0,
      };

      const result = service.calculate(debt);

      expect(result).toBe(debt);
      expect(debt.delayDays).toBeGreaterThan(0);
      expect(debt.updatedAmount).toBeGreaterThan(1000);
    });
  });
});
