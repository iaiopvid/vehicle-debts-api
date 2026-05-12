import { Test, TestingModule } from '@nestjs/testing';
import { ConsultDebtsUseCase } from './consult-debts.usecase';
import { ProviderFallbackService } from '../services/provider-fallback.service';
import { InterestCalculatorService } from '../services/interest-calculator.service';
import { PaymentSimulatorService } from '../services/payment-simulator.service';
import { DebtEntity } from '../../domain/entities/debt.entity';
import { DebtType } from '../../domain/enums/debt-type.enum';

describe('ConsultDebtsUseCase', () => {
  let useCase: ConsultDebtsUseCase;
  let mockProviderFallback: jest.Mocked<ProviderFallbackService>;
  let mockInterestCalculator: jest.Mocked<InterestCalculatorService>;
  let mockPaymentSimulator: jest.Mocked<PaymentSimulatorService>;

  const mockDebtsFromProvider: DebtEntity[] = [
    {
      type: DebtType.IPVA,
      originalAmount: 1500,
      updatedAmount: 1500,
      dueDate: '2024-01-10',
      delayDays: 0,
    },
    {
      type: DebtType.MULTA,
      originalAmount: 300.5,
      updatedAmount: 300.5,
      dueDate: '2024-02-15',
      delayDays: 0,
    },
  ];

  beforeEach(async () => {
    mockProviderFallback = {
      getDebts: jest.fn(),
    } as any;

    mockInterestCalculator = {
      calculate: jest.fn(),
    } as any;

    mockPaymentSimulator = {
      simulate: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsultDebtsUseCase,
        { provide: ProviderFallbackService, useValue: mockProviderFallback },
        { provide: InterestCalculatorService, useValue: mockInterestCalculator },
        { provide: PaymentSimulatorService, useValue: mockPaymentSimulator },
      ],
    }).compile();

    useCase = module.get<ConsultDebtsUseCase>(ConsultDebtsUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute - Basic flow', () => {
    it('should call provider with correct plate', async () => {
      const plate = 'ABC1234';
      mockProviderFallback.getDebts.mockResolvedValueOnce([]);
      mockInterestCalculator.calculate.mockImplementation((d) => d);
      mockPaymentSimulator.simulate.mockReturnValueOnce({
        pix: { total_com_desconto: 0 },
        cartao_credito: { parcelas: [] },
      });

      await useCase.execute(plate);

      expect(mockProviderFallback.getDebts).toHaveBeenCalledWith(plate);
      expect(mockProviderFallback.getDebts).toHaveBeenCalledTimes(1);
    });

    it('should return response with placa', async () => {
      const plate = 'ABC1234';
      mockProviderFallback.getDebts.mockResolvedValueOnce([]);
      mockInterestCalculator.calculate.mockImplementation((d) => d);
      mockPaymentSimulator.simulate.mockReturnValueOnce({
        pix: { total_com_desconto: 0 },
        cartao_credito: { parcelas: [] },
      });

      const result = await useCase.execute(plate);

      expect(result).toHaveProperty('placa');
      expect(result.placa).toBe(plate);
    });

    it('should calculate interest for each debt', async () => {
      const plate = 'ABC1234';
      mockProviderFallback.getDebts.mockResolvedValueOnce(mockDebtsFromProvider);
      mockInterestCalculator.calculate.mockImplementation((d) => d);
      mockPaymentSimulator.simulate.mockReturnValue({
        pix: { total_com_desconto: 0 },
        cartao_credito: { parcelas: [] },
      });

      await useCase.execute(plate);

      expect(mockInterestCalculator.calculate).toHaveBeenCalledTimes(
        mockDebtsFromProvider.length,
      );
    });

    it('should pass each debt to interest calculator', async () => {
      const plate = 'ABC1234';
      mockProviderFallback.getDebts.mockResolvedValueOnce(mockDebtsFromProvider);
      mockInterestCalculator.calculate.mockImplementation((d) => d);
      mockPaymentSimulator.simulate.mockReturnValue({
        pix: { total_com_desconto: 0 },
        cartao_credito: { parcelas: [] },
      });

      await useCase.execute(plate);

      mockDebtsFromProvider.forEach((debt) => {
        expect(mockInterestCalculator.calculate).toHaveBeenCalledWith(debt);
      });
    });
  });

  describe('execute - Response structure', () => {
    it('should return complete response object', async () => {
      const plate = 'ABC1234';
      mockProviderFallback.getDebts.mockResolvedValueOnce(mockDebtsFromProvider);
      mockInterestCalculator.calculate.mockImplementation((d) => d);
      mockPaymentSimulator.simulate.mockReturnValue({
        pix: { total_com_desconto: 1425 },
        cartao_credito: { parcelas: [] },
      });

      const result = await useCase.execute(plate);

      expect(result).toHaveProperty('placa');
      expect(result).toHaveProperty('debitos');
      expect(result).toHaveProperty('resumo');
      expect(result).toHaveProperty('pagamentos');
    });

    it('should have debitos array in response', async () => {
      const plate = 'ABC1234';
      mockProviderFallback.getDebts.mockResolvedValueOnce(mockDebtsFromProvider);
      mockInterestCalculator.calculate.mockImplementation((d) => d);
      mockPaymentSimulator.simulate.mockReturnValue({
        pix: { total_com_desconto: 1425 },
        cartao_credito: { parcelas: [] },
      });

      const result = await useCase.execute(plate);

      expect(Array.isArray(result.debitos)).toBe(true);
      expect(result.debitos.length).toBe(mockDebtsFromProvider.length);
    });

    it('should map debt properties correctly in debitos', async () => {
      const plate = 'ABC1234';
      mockProviderFallback.getDebts.mockResolvedValueOnce(mockDebtsFromProvider);
      mockInterestCalculator.calculate.mockImplementation((d) => d);
      mockPaymentSimulator.simulate.mockReturnValue({
        pix: { total_com_desconto: 1425 },
        cartao_credito: { parcelas: [] },
      });

      const result = await useCase.execute(plate);

      const firstDebito = result.debitos[0];
      expect(firstDebito).toHaveProperty('tipo');
      expect(firstDebito).toHaveProperty('valor_original');
      expect(firstDebito).toHaveProperty('valor_atualizado');
      expect(firstDebito).toHaveProperty('vencimento');
      expect(firstDebito).toHaveProperty('dias_atraso');
    });

    it('should have resumo with total values', async () => {
      const plate = 'ABC1234';
      mockProviderFallback.getDebts.mockResolvedValueOnce(mockDebtsFromProvider);
      mockInterestCalculator.calculate.mockImplementation((d) => d);
      mockPaymentSimulator.simulate.mockReturnValue({
        pix: { total_com_desconto: 1425 },
        cartao_credito: { parcelas: [] },
      });

      const result = await useCase.execute(plate);

      expect(result.resumo).toHaveProperty('total_original');
      expect(result.resumo).toHaveProperty('total_atualizado');
    });

    it('should have pagamentos with opcoes', async () => {
      const plate = 'ABC1234';
      mockProviderFallback.getDebts.mockResolvedValueOnce(mockDebtsFromProvider);
      mockInterestCalculator.calculate.mockImplementation((d) => d);
      mockPaymentSimulator.simulate.mockReturnValue({
        pix: { total_com_desconto: 1425 },
        cartao_credito: { parcelas: [] },
      });

      const result = await useCase.execute(plate);

      expect(result.pagamentos).toHaveProperty('opcoes');
      expect(Array.isArray(result.pagamentos.opcoes)).toBe(true);
      expect(result.pagamentos.opcoes.length).toBe(3);
    });
  });

  describe('execute - Calculations', () => {
    it('should calculate correct total original amount', async () => {
      const plate = 'ABC1234';
      mockProviderFallback.getDebts.mockResolvedValueOnce(mockDebtsFromProvider);
      mockInterestCalculator.calculate.mockImplementation((d) => d);
      mockPaymentSimulator.simulate.mockReturnValue({
        pix: { total_com_desconto: 1425 },
        cartao_credito: { parcelas: [] },
      });

      const result = await useCase.execute(plate);

      const expectedTotal = 1500 + 300.5;
      expect(result.resumo.total_original).toBe(expectedTotal);
    });

    it('should use payment simulator for each payment option', async () => {
      const plate = 'ABC1234';
      mockProviderFallback.getDebts.mockResolvedValueOnce(mockDebtsFromProvider);
      mockInterestCalculator.calculate.mockImplementation((d) => d);
      mockPaymentSimulator.simulate.mockReturnValue({
        pix: { total_com_desconto: 1425 },
        cartao_credito: { parcelas: [] },
      });

      await useCase.execute(plate);

      // Should be called 3 times (TOTAL, IPVA, MULTA)
      expect(mockPaymentSimulator.simulate).toHaveBeenCalledTimes(3);
    });

    it('should have TOTAL payment option', async () => {
      const plate = 'ABC1234';
      mockProviderFallback.getDebts.mockResolvedValueOnce(mockDebtsFromProvider);
      mockInterestCalculator.calculate.mockImplementation((d) => d);
      mockPaymentSimulator.simulate.mockReturnValue({
        pix: { total_com_desconto: 1425 },
        cartao_credito: { parcelas: [] },
      });

      const result = await useCase.execute(plate);

      const totalOption = result.pagamentos.opcoes.find((o) => o.tipo === 'TOTAL');
      expect(totalOption).toBeDefined();
    });

    it('should have SOMENTE_IPVA payment option', async () => {
      const plate = 'ABC1234';
      mockProviderFallback.getDebts.mockResolvedValueOnce(mockDebtsFromProvider);
      mockInterestCalculator.calculate.mockImplementation((d) => d);
      mockPaymentSimulator.simulate.mockReturnValue({
        pix: { total_com_desconto: 1425 },
        cartao_credito: { parcelas: [] },
      });

      const result = await useCase.execute(plate);

      const ipvaOption = result.pagamentos.opcoes.find(
        (o) => o.tipo === 'SOMENTE_IPVA',
      );
      expect(ipvaOption).toBeDefined();
    });

    it('should have SOMENTE_MULTAS payment option', async () => {
      const plate = 'ABC1234';
      mockProviderFallback.getDebts.mockResolvedValueOnce(mockDebtsFromProvider);
      mockInterestCalculator.calculate.mockImplementation((d) => d);
      mockPaymentSimulator.simulate.mockReturnValue({
        pix: { total_com_desconto: 1425 },
        cartao_credito: { parcelas: [] },
      });

      const result = await useCase.execute(plate);

      const multasOption = result.pagamentos.opcoes.find(
        (o) => o.tipo === 'SOMENTE_MULTAS',
      );
      expect(multasOption).toBeDefined();
    });
  });

  describe('execute - Empty and edge cases', () => {
    it('should handle empty debts array', async () => {
      const plate = 'ABC1234';
      mockProviderFallback.getDebts.mockResolvedValueOnce([]);
      mockPaymentSimulator.simulate.mockReturnValue({
        pix: { total_com_desconto: 0 },
        cartao_credito: { parcelas: [] },
      });

      const result = await useCase.execute(plate);

      expect(result.debitos).toHaveLength(0);
      expect(result.resumo.total_original).toBe(0);
      expect(result.resumo.total_atualizado).toBe(0);
    });

    it('should handle single debt', async () => {
      const plate = 'ABC1234';
      const singleDebt = [mockDebtsFromProvider[0]];
      mockProviderFallback.getDebts.mockResolvedValueOnce(singleDebt);
      mockInterestCalculator.calculate.mockImplementation((d) => d);
      mockPaymentSimulator.simulate.mockReturnValue({
        pix: { total_com_desconto: 1425 },
        cartao_credito: { parcelas: [] },
      });

      const result = await useCase.execute(plate);

      expect(result.debitos).toHaveLength(1);
    });

    it('should return 2 decimal places for totals', async () => {
      const plate = 'ABC1234';
      mockProviderFallback.getDebts.mockResolvedValueOnce(mockDebtsFromProvider);
      mockInterestCalculator.calculate.mockImplementation((d) => d);
      mockPaymentSimulator.simulate.mockReturnValue({
        pix: { total_com_desconto: 1425 },
        cartao_credito: { parcelas: [] },
      });

      const result = await useCase.execute(plate);

      const originalStr = result.resumo.total_original.toString();
      const updatedStr = result.resumo.total_atualizado.toString();

      expect(originalStr).toMatch(/^\d+(\.\d{1,2})?$/);
      expect(updatedStr).toMatch(/^\d+(\.\d{1,2})?$/);
    });
  });
});
