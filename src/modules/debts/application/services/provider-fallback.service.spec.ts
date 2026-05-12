import { Test, TestingModule } from '@nestjs/testing';
import { ProviderFallbackService } from './provider-fallback.service';
import { ProviderAAdapter } from '../../infrastructure/providers/provider-a.adapter';
import { ProviderBAdapter } from '../../infrastructure/providers/provider-b.adapter';
import { DebtEntity } from '../../domain/entities/debt.entity';
import { DebtType } from '../../domain/enums/debt-type.enum';

describe('ProviderFallbackService', () => {
  let service: ProviderFallbackService;
  let mockProviderA: jest.Mocked<ProviderAAdapter>;
  let mockProviderB: jest.Mocked<ProviderBAdapter>;

  const mockDebtA: DebtEntity = {
    type: DebtType.IPVA,
    originalAmount: 1500,
    updatedAmount: 1500,
    dueDate: '2024-01-10',
    delayDays: 0,
  };

  const mockDebtB: DebtEntity = {
    type: DebtType.MULTA,
    originalAmount: 300.5,
    updatedAmount: 300.5,
    dueDate: '2024-02-15',
    delayDays: 0,
  };

  beforeEach(async () => {
    // Create mocks
    mockProviderA = {
      getDebts: jest.fn(),
    } as any;

    mockProviderB = {
      getDebts: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProviderFallbackService,
        { provide: ProviderAAdapter, useValue: mockProviderA },
        { provide: ProviderBAdapter, useValue: mockProviderB },
      ],
    }).compile();

    service = module.get<ProviderFallbackService>(ProviderFallbackService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDebts - Provider A success', () => {
    it('should return debts from Provider A when successful', async () => {
      const plate = 'ABC1234';
      const expectedDebts = [mockDebtA, mockDebtB];

      mockProviderA.getDebts.mockResolvedValueOnce(expectedDebts);

      const result = await service.getDebts(plate);

      expect(result).toEqual(expectedDebts);
      expect(mockProviderA.getDebts).toHaveBeenCalledWith(plate);
      expect(mockProviderB.getDebts).not.toHaveBeenCalled();
    });

    it('should call Provider A with correct plate', async () => {
      const plate = 'XYZ9876';
      mockProviderA.getDebts.mockResolvedValueOnce([]);

      await service.getDebts(plate);

      expect(mockProviderA.getDebts).toHaveBeenCalledWith(plate);
      expect(mockProviderA.getDebts).toHaveBeenCalledTimes(1);
    });

    it('should return multiple debts from Provider A', async () => {
      const plate = 'ABC1234';
      const debts = [mockDebtA, mockDebtB];

      mockProviderA.getDebts.mockResolvedValueOnce(debts);

      const result = await service.getDebts(plate);

      expect(result).toHaveLength(2);
      expect(result).toEqual(debts);
    });

    it('should return empty array when Provider A has no debts', async () => {
      const plate = 'ABC1234';
      mockProviderA.getDebts.mockResolvedValueOnce([]);

      const result = await service.getDebts(plate);

      expect(result).toEqual([]);
    });
  });

  describe('getDebts - Fallback to Provider B', () => {
    it('should fallback to Provider B when Provider A fails', async () => {
      const plate = 'ABC1234';
      const fallbackDebts = [mockDebtA];

      mockProviderA.getDebts.mockRejectedValueOnce(new Error('Provider A timeout'));
      mockProviderB.getDebts.mockResolvedValueOnce(fallbackDebts);

      const result = await service.getDebts(plate);

      expect(result).toEqual(fallbackDebts);
      expect(mockProviderA.getDebts).toHaveBeenCalledWith(plate);
      expect(mockProviderB.getDebts).toHaveBeenCalledWith(plate);
    });

    it('should not call Provider B if Provider A succeeds', async () => {
      const plate = 'ABC1234';
      mockProviderA.getDebts.mockResolvedValueOnce([mockDebtA]);

      await service.getDebts(plate);

      expect(mockProviderB.getDebts).not.toHaveBeenCalled();
    });

    it('should call Provider B with the same plate on fallback', async () => {
      const plate = 'XYZ9876';

      mockProviderA.getDebts.mockRejectedValueOnce(new Error('Failed'));
      mockProviderB.getDebts.mockResolvedValueOnce([]);

      await service.getDebts(plate);

      expect(mockProviderB.getDebts).toHaveBeenCalledWith(plate);
    });

    it('should propagate error from Provider B if both fail', async () => {
      const plate = 'ABC1234';
      const providerBError = new Error('Provider B also failed');

      mockProviderA.getDebts.mockRejectedValueOnce(new Error('Provider A timeout'));
      mockProviderB.getDebts.mockRejectedValueOnce(providerBError);

      await expect(service.getDebts(plate)).rejects.toThrow('Provider B also failed');
    });
  });

  describe('getDebts - Error scenarios', () => {
    it('should catch and handle Provider A timeout error', async () => {
      const plate = 'ABC1234';

      mockProviderA.getDebts.mockRejectedValueOnce(new Error('Provider A timeout'));
      mockProviderB.getDebts.mockResolvedValueOnce([mockDebtA]);

      const result = await service.getDebts(plate);

      expect(result).toBeDefined();
      expect(result).toEqual([mockDebtA]);
    });

    it('should handle various error types from Provider A', async () => {
      const plate = 'ABC1234';
      const typedError = new TypeError('Invalid format');

      mockProviderA.getDebts.mockRejectedValueOnce(typedError);
      mockProviderB.getDebts.mockResolvedValueOnce([mockDebtA]);

      const result = await service.getDebts(plate);

      expect(result).toEqual([mockDebtA]);
    });

    it('should handle network errors', async () => {
      const plate = 'ABC1234';
      const networkError = new Error('Network timeout');

      mockProviderA.getDebts.mockRejectedValueOnce(networkError);
      mockProviderB.getDebts.mockResolvedValueOnce([mockDebtB]);

      const result = await service.getDebts(plate);

      expect(result).toEqual([mockDebtB]);
    });

    it('should rethrow Provider B error if no fallback available', async () => {
      const plate = 'ABC1234';
      const error = new Error('Critical error');

      mockProviderA.getDebts.mockRejectedValueOnce(new Error('Provider A failed'));
      mockProviderB.getDebts.mockRejectedValueOnce(error);

      await expect(service.getDebts(plate)).rejects.toThrow('Critical error');
    });
  });

  describe('getDebts - Integration', () => {
    it('should successfully use fallback when both providers have data', async () => {
      const plate = 'ABC1234';
      const primaryDebts = [mockDebtA];
      const fallbackDebts = [mockDebtB];

      mockProviderA.getDebts.mockRejectedValueOnce(new Error('Provider A failed'));
      mockProviderB.getDebts.mockResolvedValueOnce(fallbackDebts);

      const result = await service.getDebts(plate);

      expect(result).toEqual(fallbackDebts);
      expect(result).not.toEqual(primaryDebts);
    });

    it('should handle sequential calls independently', async () => {
      const plate1 = 'ABC1234';
      const plate2 = 'XYZ9876';

      mockProviderA.getDebts.mockResolvedValueOnce([mockDebtA]);
      mockProviderA.getDebts.mockResolvedValueOnce([mockDebtB]);

      const result1 = await service.getDebts(plate1);
      const result2 = await service.getDebts(plate2);

      expect(result1).toEqual([mockDebtA]);
      expect(result2).toEqual([mockDebtB]);
      expect(mockProviderA.getDebts).toHaveBeenCalledTimes(2);
    });
  });
});
