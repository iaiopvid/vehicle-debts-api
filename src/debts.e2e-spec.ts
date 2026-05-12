import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './app.module';

describe('Debts E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /debts/consult', () => {
    it('should return 200 with valid plate', async () => {
      const response = await request(app.getHttpServer())
        .post('/debts/consult')
        .send({ placa: 'ABC1234' });

      expect(response.status).toBe(200);
    });

    it('should return complete response structure', async () => {
      const response = await request(app.getHttpServer())
        .post('/debts/consult')
        .send({ placa: 'ABC1234' });

      expect(response.body).toHaveProperty('placa');
      expect(response.body).toHaveProperty('debitos');
      expect(response.body).toHaveProperty('resumo');
      expect(response.body).toHaveProperty('pagamentos');
    });

    it('should return plate in response', async () => {
      const plate = 'ABC1234';
      const response = await request(app.getHttpServer())
        .post('/debts/consult')
        .send({ placa: plate });

      expect(response.body.placa).toBe(plate);
    });

    it('should return debitos array', async () => {
      const response = await request(app.getHttpServer())
        .post('/debts/consult')
        .send({ placa: 'ABC1234' });

      expect(Array.isArray(response.body.debitos)).toBe(true);
    });

    it('should return resumo with totals', async () => {
      const response = await request(app.getHttpServer())
        .post('/debts/consult')
        .send({ placa: 'ABC1234' });

      expect(response.body.resumo).toHaveProperty('total_original');
      expect(response.body.resumo).toHaveProperty('total_atualizado');
      expect(typeof response.body.resumo.total_original).toBe('number');
      expect(typeof response.body.resumo.total_atualizado).toBe('number');
    });

    it('should return pagamentos with opcoes', async () => {
      const response = await request(app.getHttpServer())
        .post('/debts/consult')
        .send({ placa: 'ABC1234' });

      expect(response.body.pagamentos).toHaveProperty('opcoes');
      expect(Array.isArray(response.body.pagamentos.opcoes)).toBe(true);
      expect(response.body.pagamentos.opcoes.length).toBe(3);
    });

    it('should have payment options: TOTAL, SOMENTE_IPVA, SOMENTE_MULTAS', async () => {
      const response = await request(app.getHttpServer())
        .post('/debts/consult')
        .send({ placa: 'ABC1234' });

      const tipos = response.body.pagamentos.opcoes.map((o: any) => o.tipo);
      expect(tipos).toContain('TOTAL');
      expect(tipos).toContain('SOMENTE_IPVA');
      expect(tipos).toContain('SOMENTE_MULTAS');
    });

    it('should return debito with correct structure', async () => {
      const response = await request(app.getHttpServer())
        .post('/debts/consult')
        .send({ placa: 'ABC1234' });

      if (response.body.debitos.length > 0) {
        const debito = response.body.debitos[0];
        expect(debito).toHaveProperty('tipo');
        expect(debito).toHaveProperty('valor_original');
        expect(debito).toHaveProperty('valor_atualizado');
        expect(debito).toHaveProperty('vencimento');
        expect(debito).toHaveProperty('dias_atraso');
      }
    });

    it('should calculate updated amount greater than original (with interest)', async () => {
      const response = await request(app.getHttpServer())
        .post('/debts/consult')
        .send({ placa: 'ABC1234' });

      response.body.debitos.forEach((debito: any) => {
        expect(debito.valor_atualizado).toBeGreaterThanOrEqual(debito.valor_original);
      });
    });

    it('should return pagamento option with valor_base', async () => {
      const response = await request(app.getHttpServer())
        .post('/debts/consult')
        .send({ placa: 'ABC1234' });

      response.body.pagamentos.opcoes.forEach((opcao: any) => {
        expect(opcao).toHaveProperty('valor_base');
        expect(typeof opcao.valor_base).toBe('number');
      });
    });

    it('should return payment option with pix discount', async () => {
      const response = await request(app.getHttpServer())
        .post('/debts/consult')
        .send({ placa: 'ABC1234' });

      response.body.pagamentos.opcoes.forEach((opcao: any) => {
        expect(opcao).toHaveProperty('pix');
        expect(opcao.pix).toHaveProperty('total_com_desconto');
      });
    });

    it('should return payment option with credit card installments', async () => {
      const response = await request(app.getHttpServer())
        .post('/debts/consult')
        .send({ placa: 'ABC1234' });

      response.body.pagamentos.opcoes.forEach((opcao: any) => {
        expect(opcao).toHaveProperty('cartao_credito');
        expect(opcao.cartao_credito).toHaveProperty('parcelas');
        expect(Array.isArray(opcao.cartao_credito.parcelas)).toBe(true);
      });
    });

    it('should have 3 installment options (1, 6, 12)', async () => {
      const response = await request(app.getHttpServer())
        .post('/debts/consult')
        .send({ placa: 'ABC1234' });

      const parcelas = response.body.pagamentos.opcoes[0].cartao_credito.parcelas;
      expect(parcelas.length).toBe(3);
      expect(parcelas[0].quantidade).toBe(1);
      expect(parcelas[1].quantidade).toBe(6);
      expect(parcelas[2].quantidade).toBe(12);
    });

    it('should have PIX discount less than original value', async () => {
      const response = await request(app.getHttpServer())
        .post('/debts/consult')
        .send({ placa: 'ABC1234' });

      const totalOption = response.body.pagamentos.opcoes.find(
        (o: any) => o.tipo === 'TOTAL',
      );
      if (totalOption && totalOption.valor_base > 0) {
        expect(totalOption.pix.total_com_desconto).toBeLessThan(
          totalOption.valor_base,
        );
      }
    });
  });

  describe('POST /debts/consult - Validation', () => {
    it('should return 400 for invalid plate format (lowercase)', async () => {
      const response = await request(app.getHttpServer())
        .post('/debts/consult')
        .send({ placa: 'abc1234' });

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid plate format (short)', async () => {
      const response = await request(app.getHttpServer())
        .post('/debts/consult')
        .send({ placa: 'AB1234' });

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid plate format (all numbers)', async () => {
      const response = await request(app.getHttpServer())
        .post('/debts/consult')
        .send({ placa: '1234567' });

      expect(response.status).toBe(400);
    });

    it('should return 400 for missing placa field', async () => {
      const response = await request(app.getHttpServer())
        .post('/debts/consult')
        .send({});

      expect(response.status).toBe(400);
    });

    it('should return 400 for non-string placa', async () => {
      const response = await request(app.getHttpServer())
        .post('/debts/consult')
        .send({ placa: 12345 });

      expect(response.status).toBe(400);
    });

    it('should accept valid new format plate (AAA1A23)', async () => {
      const response = await request(app.getHttpServer())
        .post('/debts/consult')
        .send({ placa: 'ABC1D23' });

      expect(response.status).toBe(200);
    });

    it('should return error message for invalid plate', async () => {
      const response = await request(app.getHttpServer())
        .post('/debts/consult')
        .send({ placa: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /debts/consult - Multiple requests', () => {
    it('should handle sequential requests', async () => {
      const plates = ['ABC1234', 'XYZ9876', 'AAA1A23'];

      for (const plate of plates) {
        const response = await request(app.getHttpServer())
          .post('/debts/consult')
          .send({ placa: plate });

        expect(response.status).toBe(200);
        expect(response.body.placa).toBe(plate);
      }
    });

    it('should return different responses for different plates', async () => {
      const response1 = await request(app.getHttpServer())
        .post('/debts/consult')
        .send({ placa: 'ABC1234' });

      const response2 = await request(app.getHttpServer())
        .post('/debts/consult')
        .send({ placa: 'XYZ9876' });

      expect(response1.body.placa).not.toBe(response2.body.placa);
    });

    it('should maintain response consistency across requests', async () => {
      const response1 = await request(app.getHttpServer())
        .post('/debts/consult')
        .send({ placa: 'ABC1234' });

      const response2 = await request(app.getHttpServer())
        .post('/debts/consult')
        .send({ placa: 'ABC1234' });

      expect(response1.status).toBe(response2.status);
      expect(response1.body.placa).toBe(response2.body.placa);
    });
  });

  describe('POST /debts/consult - Data integrity', () => {
    it('should return 2 decimal places for all money values', async () => {
      const response = await request(app.getHttpServer())
        .post('/debts/consult')
        .send({ placa: 'ABC1234' });

      response.body.debitos.forEach((debito: any) => {
        const originalStr = debito.valor_original.toString();
        const updatedStr = debito.valor_atualizado.toString();

        expect(originalStr).toMatch(/^\d+(\.\d{1,2})?$/);
        expect(updatedStr).toMatch(/^\d+(\.\d{1,2})?$/);
      });
    });

    it('should have positive values for all amounts', async () => {
      const response = await request(app.getHttpServer())
        .post('/debts/consult')
        .send({ placa: 'ABC1234' });

      expect(response.body.resumo.total_original).toBeGreaterThanOrEqual(0);
      expect(response.body.resumo.total_atualizado).toBeGreaterThanOrEqual(0);

      response.body.debitos.forEach((debito: any) => {
        expect(debito.valor_original).toBeGreaterThanOrEqual(0);
        expect(debito.valor_atualizado).toBeGreaterThanOrEqual(0);
      });
    });

    it('should have consistent total calculations', async () => {
      const response = await request(app.getHttpServer())
        .post('/debts/consult')
        .send({ placa: 'ABC1234' });

      let calculatedTotal = 0;
      response.body.debitos.forEach((debito: any) => {
        calculatedTotal += debito.valor_atualizado;
      });

      const responseTotal = response.body.resumo.total_atualizado;
      expect(Math.abs(calculatedTotal - responseTotal)).toBeLessThan(0.01);
    });
  });

  describe('POST /debts/consult - Integration flow', () => {
    it('should complete full consultation flow', async () => {
      const response = await request(app.getHttpServer())
        .post('/debts/consult')
        .send({ placa: 'ABC1234' });

      // Validate status
      expect(response.status).toBe(200);

      // Validate structure
      expect(response.body).toHaveProperty('placa');
      expect(response.body).toHaveProperty('debitos');
      expect(response.body).toHaveProperty('resumo');
      expect(response.body).toHaveProperty('pagamentos');

      // Validate plate
      expect(response.body.placa).toBe('ABC1234');

      // Validate debitos
      expect(Array.isArray(response.body.debitos)).toBe(true);

      // Validate resumo
      expect(response.body.resumo.total_original).toBeGreaterThanOrEqual(0);
      expect(response.body.resumo.total_atualizado).toBeGreaterThanOrEqual(0);

      // Validate pagamentos
      expect(response.body.pagamentos.opcoes.length).toBe(3);

      // Validate each payment option has required fields
      response.body.pagamentos.opcoes.forEach((opcao: any) => {
        expect(opcao).toHaveProperty('tipo');
        expect(opcao).toHaveProperty('valor_base');
        expect(opcao).toHaveProperty('pix');
        expect(opcao).toHaveProperty('cartao_credito');
      });
    });
  });

  describe('Health Check', () => {
    it('should have app running', async () => {
      expect(app).toBeDefined();
    });

    it('should accept POST requests to /debts/consult', async () => {
      const response = await request(app.getHttpServer())
        .post('/debts/consult')
        .send({ placa: 'ABC1234' });

      expect(response.status).not.toBe(404);
    });
  });
});
