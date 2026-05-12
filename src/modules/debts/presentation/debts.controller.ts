import { Body, Controller, HttpCode, Post } from '@nestjs/common';

import { ConsultDebtsUseCase } from '../application/use-cases/consult-debts.usecase';
import { ConsultDebtsDto } from './dto/consult-debts.dto';

@Controller('debts')
export class DebtsController {
  constructor(
    private readonly consultDebtsUseCase: ConsultDebtsUseCase,
  ) {}

  @Post('consult')
  @HttpCode(200) 
  async consult(@Body() dto: ConsultDebtsDto) {
    return this.consultDebtsUseCase.execute(dto.placa);
  }
}
