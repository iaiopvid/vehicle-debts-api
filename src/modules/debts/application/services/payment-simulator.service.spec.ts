import { Test, TestingModule } from '@nestjs/testing';
import { PaymentSimulatorService } from './payment-simulator.service';

describe('PaymentSimulatorService', () => {
  let service: PaymentSimulatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentSimulatorService],
    }).compile();

    service = module.get<PaymentSimulatorService>(PaymentSimulatorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('simulate - PIX discount', () => {
    it('should apply 5% discount for PIX', () => {
      const baseValue = 1000;
      const result = service.simulate(baseValue);

      const expectedDiscountedValue = 1000 * 0.95;
      expect(result.pix.total_com_desconto).toBe(expectedDiscountedValue);
    });

    it('should have PIX total with 2 decimal places', () => {
      const baseValue = 1000;
      const result = service.simulate(baseValue);

      const decimalPlaces = (result.pix.total_com_desconto.toString().split('.')[1] || '').length;
      expect(decimalPlaces).toBeLessThanOrEqual(2);
    });

    it('should calculate PIX correctly for decimal values', () => {
      const baseValue = 1234.56;
      const result = service.simulate(baseValue);

      const expected = Number((1234.56 * 0.95).toFixed(2));
      expect(result.pix.total_com_desconto).toBe(expected);
    });

    it('should handle zero value', () => {
      const result = service.simulate(0);
      expect(result.pix.total_com_desconto).toBe(0);
    });

    it('should handle small values', () => {
      const baseValue = 0.1;
      const result = service.simulate(baseValue);

      const expected = Number((0.1 * 0.95).toFixed(2));
      expect(result.pix.total_com_desconto).toBe(expected);
    });
  });

  describe('simulate - Credit card installments', () => {
    it('should return 3 installment options', () => {
      const baseValue = 1000;
      const result = service.simulate(baseValue);

      expect(result.cartao_credito.parcelas).toHaveLength(3);
    });

    it('should have installment quantities [1, 6, 12]', () => {
      const baseValue = 1000;
      const result = service.simulate(baseValue);

      expect(result.cartao_credito.parcelas[0].quantidade).toBe(1);
      expect(result.cartao_credito.parcelas[1].quantidade).toBe(6);
      expect(result.cartao_credito.parcelas[2].quantidade).toBe(12);
    });

    it('should calculate 1 installment without interest', () => {
      const baseValue = 1000;
      const result = service.simulate(baseValue);

      const installment = result.cartao_credito.parcelas[0];
      expect(installment.quantidade).toBe(1);
      expect(installment.valor_parcela).toBe(baseValue);
    });

    it('should calculate 6 installments with 2.5% monthly rate', () => {
      const baseValue = 1000;
      const result = service.simulate(baseValue);

      const installment = result.cartao_credito.parcelas[1];
      expect(installment.quantidade).toBe(6);

      const monthlyRate = 0.025;
      const expectedValue = (baseValue * Math.pow(1 + monthlyRate, 6)) / 6;
      expect(installment.valor_parcela).toBe(Number(expectedValue.toFixed(2)));
    });

    it('should calculate 12 installments with 2.5% monthly rate', () => {
      const baseValue = 1000;
      const result = service.simulate(baseValue);

      const installment = result.cartao_credito.parcelas[2];
      expect(installment.quantidade).toBe(12);

      const monthlyRate = 0.025;
      const expectedValue = (baseValue * Math.pow(1 + monthlyRate, 12)) / 12;
      expect(installment.valor_parcela).toBe(Number(expectedValue.toFixed(2)));
    });

    it('should have installment values with 2 decimal places', () => {
      const baseValue = 1234.56;
      const result = service.simulate(baseValue);

      result.cartao_credito.parcelas.forEach((installment) => {
        const decimalPlaces = (installment.valor_parcela.toString().split('.')[1] || '').length;
        expect(decimalPlaces).toBeLessThanOrEqual(2);
      });
    });

    it('should handle large values', () => {
      const baseValue = 100000;
      const result = service.simulate(baseValue);

      expect(result.cartao_credito.parcelas.length).toBe(3);
      result.cartao_credito.parcelas.forEach((installment) => {
        expect(installment.valor_parcela).toBeGreaterThan(0);
      });
    });
  });

  describe('simulate - Structure', () => {
    it('should return complete payment simulation object', () => {
      const baseValue = 1000;
      const result = service.simulate(baseValue);

      expect(result).toHaveProperty('pix');
      expect(result).toHaveProperty('cartao_credito');
      expect(result.pix).toHaveProperty('total_com_desconto');
      expect(result.cartao_credito).toHaveProperty('parcelas');
    });

    it('should not include commented out credit card options', () => {
      const baseValue = 1000;
      const result = service.simulate(baseValue);

      // Ensure only pix and cartao_credito exist
      const keys = Object.keys(result);
      expect(keys).toEqual(['pix', 'cartao_credito']);
    });
  });

  describe('simulate - Comparisons', () => {
    it('6 installments should be cheaper per unit than 12 installments', () => {
      const baseValue = 1000;
      const result = service.simulate(baseValue);

      const installment6 = result.cartao_credito.parcelas[1].valor_parcela;
      const installment12 = result.cartao_credito.parcelas[2].valor_parcela;

      expect(installment6).toBeGreaterThan(installment12);
    });

    it('PIX discount should be less than full price but more than installments', () => {
      const baseValue = 1000;
      const result = service.simulate(baseValue);

      const pixPrice = result.pix.total_com_desconto;
      const fullPrice = baseValue;
      const installment12 = result.cartao_credito.parcelas[2].valor_parcela * 12;

      expect(pixPrice).toBeLessThan(fullPrice);
      expect(pixPrice).toBeLessThan(installment12);
    });
  });
});
