import { Test, TestingModule } from '@nestjs/testing';
import { ProviderAAdapter } from './provider-a.adapter';

describe('ProviderAAdapter', () => {
  let adapter: ProviderAAdapter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProviderAAdapter],
    }).compile();

    adapter = module.get<ProviderAAdapter>(ProviderAAdapter);
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  describe('getDebts', () => {
    it('should throw error due to shouldFail flag', async () => {
      const plate = 'ABC1234';

      await expect(adapter.getDebts(plate)).rejects.toThrow('Provider A timeout');
    });

    it('should throw Provider A timeout error', async () => {
      const plate = 'ABC1234';

      try {
        await adapter.getDebts(plate);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Provider A timeout');
      }
    });

    it('should accept any plate format when configured to fail', async () => {
      const plates = ['ABC1234', 'XYZ9876', 'AAA1A23'];

      for (const plate of plates) {
        await expect(adapter.getDebts(plate)).rejects.toThrow('Provider A timeout');
      }
    });

    it('should be an async function', () => {
      adapter.setSimulateShouldFail(false);

      expect(adapter.getDebts('ABC1234')).toBeInstanceOf(Promise);
    });

    it('should always reject with the same error', async () => {
      const plate1 = 'ABC1234';
      const plate2 = 'XYZ9876';

      const error1 = await adapter.getDebts(plate1).catch((e) => e.message);
      const error2 = await adapter.getDebts(plate2).catch((e) => e.message);

      expect(error1).toBe('Provider A timeout');
      expect(error2).toBe('Provider A timeout');
    });
  });

  describe('Integration scenarios', () => {
    it('should be used as fallback provider', async () => {
      // Simulating usage in fallback scenario
      let result;
      try {
        result = await adapter.getDebts('ABC1234');
      } catch (error) {
        // Expected to fail
        expect((error as Error).message).toBe('Provider A timeout');
      }

      expect(result).toBeUndefined();
    });
  });
});
