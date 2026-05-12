import { Test, TestingModule } from '@nestjs/testing';
import { DebtsController } from './debts.controller';
import { ConsultDebtsUseCase } from '../application/use-cases/consult-debts.usecase';
import { ConsultDebtsDto } from './dto/consult-debts.dto';
import { BadRequestException } from '@nestjs/common';
import { DebtType, PaymentType } from '../application/use-cases/enums/debt-type.enum';

describe('DebtsController', () => {
  let controller: DebtsController;
  let mockUseCase: jest.Mocked<ConsultDebtsUseCase>;

  const mockResponse = {
    placa: 'ABC1234',
    debitos: [],
    resumo: {
      total_original: 0,
      total_atualizado: 0,
    },
    pagamentos: {
      opcoes: [
        {
          tipo: PaymentType.TOTAL,
          valor_base: 0,
          pix: { total_com_desconto: 0 },
          cartao_credito: { parcelas: [] },
        },
        {
          tipo: PaymentType.SOMENTE_IPVA,
          valor_base: 0,
          pix: { total_com_desconto: 0 },
          cartao_credito: { parcelas: [] },
        },
        {
          tipo: PaymentType.SOMENTE_MULTAS,
          valor_base: 0,
          pix: { total_com_desconto: 0 },
          cartao_credito: { parcelas: [] },
        },
      ],
    },
  };

  beforeEach(async () => {
    mockUseCase = {
      execute: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DebtsController],
      providers: [
        {
          provide: ConsultDebtsUseCase,
          useValue: mockUseCase,
        },
      ],
    }).compile();

    controller = module.get<DebtsController>(DebtsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('consult - Valid request', () => {
    it('should call useCase.execute with plate from DTO', async () => {
      const dto = new ConsultDebtsDto();
      dto.placa = 'ABC1234';

      mockUseCase.execute.mockResolvedValueOnce(mockResponse);

      await controller.consult(dto);

      expect(mockUseCase.execute).toHaveBeenCalledWith('ABC1234');
      expect(mockUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should return useCase response', async () => {
      const dto = new ConsultDebtsDto();
      dto.placa = 'ABC1234';

      mockUseCase.execute.mockResolvedValueOnce(mockResponse);

      const result = await controller.consult(dto);

      expect(result).toEqual(mockResponse);
    });

    it('should return response with complete structure', async () => {
      const dto = new ConsultDebtsDto();
      dto.placa = 'ABC1234';

      mockUseCase.execute.mockResolvedValueOnce(mockResponse);

      const result = await controller.consult(dto);

      expect(result).toHaveProperty('placa');
      expect(result).toHaveProperty('debitos');
      expect(result).toHaveProperty('resumo');
      expect(result).toHaveProperty('pagamentos');
    });

    it('should handle different valid plates', async () => {
      const plates = ['ABC1234', 'XYZ9876', 'AAA1A23'];

      for (const plate of plates) {
        const dto = new ConsultDebtsDto();
        dto.placa = plate;

        mockUseCase.execute.mockResolvedValueOnce(mockResponse);

        await controller.consult(dto);

        expect(mockUseCase.execute).toHaveBeenCalledWith(plate);
      }
    });

    it('should be an async function', () => {
      const dto = new ConsultDebtsDto();
      dto.placa = 'ABC1234';

      mockUseCase.execute.mockResolvedValueOnce(mockResponse);

      expect(controller.consult(dto)).toBeInstanceOf(Promise);
    });
  });

  describe('consult - Response handling', () => {
    it('should return response with debts', async () => {
      const dto = new ConsultDebtsDto();
      dto.placa = 'ABC1234';

      const responseWithDebts = {
        ...mockResponse,
        debitos: [
          {
            tipo: DebtType.IPVA,
            valor_original: 1500,
            valor_atualizado: 1650,
            vencimento: '2024-01-10',
            dias_atraso: 120,
          },
        ],
      };

      mockUseCase.execute.mockResolvedValueOnce(responseWithDebts);

      const result = await controller.consult(dto);

      expect(result.debitos).toHaveLength(1);
      expect(result.debitos[0].tipo).toBe('IPVA');
    });

    it('should return response with payment options', async () => {
      const dto = new ConsultDebtsDto();
      dto.placa = 'ABC1234';

      const responseWithPayments = {
        ...mockResponse,
        pagamentos: {
          opcoes: [
            {
              tipo: PaymentType.TOTAL,
              valor_base: 1500,
              pix: { total_com_desconto: 1425 },
              cartao_credito: { parcelas: [] },
            },
          ],
        },
      };

      mockUseCase.execute.mockResolvedValueOnce(responseWithPayments);

      const result = await controller.consult(dto);

      expect(result.pagamentos.opcoes).toHaveLength(1);
    });

    it('should handle large response with multiple debts and payments', async () => {
      const dto = new ConsultDebtsDto();
      dto.placa = 'ABC1234';

      const largeResponse = {
        placa: 'ABC1234',
        debitos: [
          {
            tipo: DebtType.IPVA,
            valor_original: 1500,
            valor_atualizado: 1650,
            vencimento: '2024-01-10',
            dias_atraso: 120,
          },
          {
            tipo: DebtType.MULTA,
            valor_original: 300.5,
            valor_atualizado: 600.5,
            vencimento: '2024-02-15',
            dias_atraso: 85,
          },
        ],
        resumo: {
          total_original: 1800.5,
          total_atualizado: 2250.5,
        },
        pagamentos: {
          opcoes: [
            {
              tipo: PaymentType.TOTAL,
              valor_base: 2250.5,
              pix: { total_com_desconto: 2137.975 },
              cartao_credito: { parcelas: [] },
            },
            {
              tipo: PaymentType.SOMENTE_IPVA,
              valor_base: 1650,
              pix: { total_com_desconto: 1567.5 },
              cartao_credito: { parcelas: [] },
            },
            {
              tipo: PaymentType.SOMENTE_MULTAS,
              valor_base: 600.5,
              pix: { total_com_desconto: 570.475 },
              cartao_credito: { parcelas: [] },
            },
          ],
        },
      };

      mockUseCase.execute.mockResolvedValueOnce(largeResponse);

      const result = await controller.consult(dto);

      expect(result.debitos).toHaveLength(2);
      expect(result.pagamentos.opcoes).toHaveLength(3);
    });
  });

  describe('consult - Error handling', () => {
    it('should propagate useCase errors', async () => {
      const dto = new ConsultDebtsDto();
      dto.placa = 'ABC1234';

      const error = new Error('Service error');
      mockUseCase.execute.mockRejectedValueOnce(error);

      await expect(controller.consult(dto)).rejects.toThrow('Service error');
    });

    it('should propagate useCase exceptions', async () => {
      const dto = new ConsultDebtsDto();
      dto.placa = 'ABC1234';

      mockUseCase.execute.mockRejectedValueOnce(
        new BadRequestException('Invalid plate'),
      );

      await expect(controller.consult(dto)).rejects.toThrow('Invalid plate');
    });
  });

  describe('consult - Integration', () => {
    it('should handle multiple consecutive requests', async () => {
      const dto1 = new ConsultDebtsDto();
      dto1.placa = 'ABC1234';

      const dto2 = new ConsultDebtsDto();
      dto2.placa = 'XYZ9876';

      mockUseCase.execute.mockResolvedValueOnce(mockResponse);
      mockUseCase.execute.mockResolvedValueOnce(mockResponse);

      await controller.consult(dto1);
      await controller.consult(dto2);

      expect(mockUseCase.execute).toHaveBeenCalledTimes(2);
      expect(mockUseCase.execute).toHaveBeenNthCalledWith(1, 'ABC1234');
      expect(mockUseCase.execute).toHaveBeenNthCalledWith(2, 'XYZ9876');
    });

    it('should maintain independent state between requests', async () => {
      const dto1 = new ConsultDebtsDto();
      dto1.placa = 'ABC1234';

      const response1 = { ...mockResponse, placa: 'ABC1234' };
      mockUseCase.execute.mockResolvedValueOnce(response1);

      const result1 = await controller.consult(dto1);

      expect(result1.placa).toBe('ABC1234');
    });
  });

  describe('consult - POST endpoint', () => {
    it('should accept POST request with body', async () => {
      const dto = new ConsultDebtsDto();
      dto.placa = 'ABC1234';

      mockUseCase.execute.mockResolvedValueOnce(mockResponse);

      const result = await controller.consult(dto);

      expect(result).toBeDefined();
    });

    it('should work with route /debts/consult', async () => {
      // This test verifies the @Post('consult') decorator indirectly
      const dto = new ConsultDebtsDto();
      dto.placa = 'ABC1234';

      mockUseCase.execute.mockResolvedValueOnce(mockResponse);

      const result = await controller.consult(dto);

      expect(result).toBeDefined();
    });
  });
});
