import { Test, TestingModule } from '@nestjs/testing';
import { ProviderBAdapter } from './provider-b.adapter';

describe('ProviderBAdapter', () => {
  let adapter: ProviderBAdapter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProviderBAdapter],
    }).compile();

    adapter = module.get<ProviderBAdapter>(ProviderBAdapter);
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  describe('getDebts', () => {
    it('should return array of debts', async () => {
      const plate = 'ABC1234';

      const result = await adapter.getDebts(plate);

      expect(Array.isArray(result)).toBe(true);
    });

    it('should return correct number of debts from mock', async () => {
      const plate = 'ABC1234';

      const result = await adapter.getDebts(plate);

      expect(result.length).toBe(2);
    });

    it('should parse IPVA debt correctly', async () => {
      const plate = 'ABC1234';

      const result = await adapter.getDebts(plate);
      const ipvaDebt = result[0];

      expect(ipvaDebt.type).toBe('IPVA');
      expect(ipvaDebt.originalAmount).toBe(1500);
      expect(ipvaDebt.updatedAmount).toBe(1500);
      expect(ipvaDebt.dueDate).toBe('2024-01-10');
    });

    it('should parse MULTA debt correctly', async () => {
      const plate = 'ABC1234';

      const result = await adapter.getDebts(plate);
      const multaDebt = result[1];

      expect(multaDebt.type).toBe('MULTA');
      expect(multaDebt.originalAmount).toBe(300.5);
      expect(multaDebt.updatedAmount).toBe(300.5);
      expect(multaDebt.dueDate).toBe('2024-02-15');
    });

    it('should initialize delayDays to 0', async () => {
      const plate = 'ABC1234';

      const result = await adapter.getDebts(plate);

      result.forEach((debt) => {
        expect(debt.delayDays).toBe(0);
      });
    });

    it('should convert string values to numbers', async () => {
      const plate = 'ABC1234';

      const result = await adapter.getDebts(plate);

      result.forEach((debt) => {
        expect(typeof debt.originalAmount).toBe('number');
        expect(typeof debt.updatedAmount).toBe('number');
      });
    });

    it('should preserve decimal values', async () => {
      const plate = 'ABC1234';

      const result = await adapter.getDebts(plate);
      const multaDebt = result[1];

      expect(multaDebt.originalAmount).toBe(300.5);
    });

    it('should be an async function', () => {
      expect(adapter.getDebts('ABC1234')).toBeInstanceOf(Promise);
    });

    it('should ignore plate parameter when using mock', async () => {
      // Both plates should return same mock data
      const result1 = await adapter.getDebts('ABC1234');
      const result2 = await adapter.getDebts('XYZ9876');

      expect(result1).toEqual(result2);
    });
  });

  describe('DebtEntity structure', () => {
    it('should return debts with all required properties', async () => {
      const plate = 'ABC1234';

      const result = await adapter.getDebts(plate);

      result.forEach((debt) => {
        expect(debt).toHaveProperty('type');
        expect(debt).toHaveProperty('originalAmount');
        expect(debt).toHaveProperty('updatedAmount');
        expect(debt).toHaveProperty('dueDate');
        expect(debt).toHaveProperty('delayDays');
      });
    });

    it('should return DebtEntity compliant objects', async () => {
      const plate = 'ABC1234';

      const result = await adapter.getDebts(plate);

      result.forEach((debt) => {
        expect(['IPVA', 'MULTA']).toContain(debt.type);
        expect(typeof debt.originalAmount).toBe('number');
        expect(typeof debt.updatedAmount).toBe('number');
        expect(typeof debt.dueDate).toBe('string');
        expect(typeof debt.delayDays).toBe('number');
      });
    });
  });

  describe('XML Parsing', () => {
    it('should correctly map XML category to type', async () => {
      const plate = 'ABC1234';

      const result = await adapter.getDebts(plate);

      const types = result.map((d) => d.type);
      expect(types).toContain('IPVA');
      expect(types).toContain('MULTA');
    });

    it('should correctly map XML value to originalAmount', async () => {
      const plate = 'ABC1234';

      const result = await adapter.getDebts(plate);

      const amounts = result.map((d) => d.originalAmount);
      expect(amounts).toContain(1500);
      expect(amounts).toContain(300.5);
    });

    it('should correctly map XML expiration to dueDate', async () => {
      const plate = 'ABC1234';

      const result = await adapter.getDebts(plate);

      const dates = result.map((d) => d.dueDate);
      expect(dates).toContain('2024-01-10');
      expect(dates).toContain('2024-02-15');
    });
  });

  describe('Multiple calls', () => {
    it('should return consistent results across multiple calls', async () => {
      const plate = 'ABC1234';

      const result1 = await adapter.getDebts(plate);
      const result2 = await adapter.getDebts(plate);

      expect(result1).toEqual(result2);
    });

    it('should return independent array instances', async () => {
      const plate = 'ABC1234';

      const result1 = await adapter.getDebts(plate);
      const result2 = await adapter.getDebts(plate);

      expect(result1).not.toBe(result2);
    });
  });
});
