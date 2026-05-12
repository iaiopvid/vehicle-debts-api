import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConsultDebtsDto {
  @IsString()
  @Matches(/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/, {
    message: 'Placa deve estar no formato AAA1234 ou AAA1A23',
  })
  @ApiProperty({
    description: 'Has to match a regular expression: /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/',
    example: 'AAA1234'
  })
  placa: string;
}
