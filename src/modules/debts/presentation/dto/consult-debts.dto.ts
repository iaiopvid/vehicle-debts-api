import { IsString, Matches } from 'class-validator';

export class ConsultDebtsDto {
  @IsString()
  @Matches(/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/, {
    message: 'Placa deve estar no formato AAA1234 ou AAA1A23',
  })
  placa: string;
}
