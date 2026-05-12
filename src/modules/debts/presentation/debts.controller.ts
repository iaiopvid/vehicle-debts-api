import { Body, Controller, HttpCode, Post } from '@nestjs/common';

import { ConsultDebtsUseCase } from '../application/use-cases/consult-debts.usecase';
import { ConsultDebtsDto } from './dto/consult-debts.dto';
import { ApiParam, ApiResponse } from '@nestjs/swagger';
import { ConsultDebtsResponseDto } from '../application/use-cases/dto/consult-debts-response.dto';
import { Error400ResponseDto } from '../../../shared/dto/error-400-response.dto';

@Controller('debts')
export class DebtsController {
  constructor(
    private readonly consultDebtsUseCase: ConsultDebtsUseCase,
  ) {}

  @Post('consult')
  @HttpCode(200) 
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Should be an id of a post that exists in the database',
    type: Number
  })
  @ApiResponse({
    status: 200,
    description: 'A post has been successfully fetched',
    type: ConsultDebtsResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
    type: Error400ResponseDto
  })
  async consult(@Body() dto: ConsultDebtsDto): Promise<ConsultDebtsResponseDto> {
    return this.consultDebtsUseCase.execute(dto.placa);
  }
}
