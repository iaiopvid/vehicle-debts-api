import { validate } from 'class-validator';
import { ConsultDebtsDto } from './consult-debts.dto';

describe('ConsultDebtsDto', () => {
  describe('Placa Validation', () => {
    it('should validate correct plate format AAA1234', async () => {
      const dto = new ConsultDebtsDto();
      dto.placa = 'ABC1234';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate correct plate format AAA1A23', async () => {
      const dto = new ConsultDebtsDto();
      dto.placa = 'ABC1D23';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject invalid plate format - lowercase', async () => {
      const dto = new ConsultDebtsDto();
      dto.placa = 'abc1234';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.matches).toBeDefined();
    });

    it('should reject invalid plate format - wrong length', async () => {
      const dto = new ConsultDebtsDto();
      dto.placa = 'AB1234';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid plate format - all numbers', async () => {
      const dto = new ConsultDebtsDto();
      dto.placa = '1234567';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject non-string placa', async () => {
      const dto = new ConsultDebtsDto();
      (dto as any).placa = 12345;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
