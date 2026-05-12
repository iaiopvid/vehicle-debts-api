import { DebtType, PaymentType } from "../enums/debt-type.enum"
import { ApiProperty } from '@nestjs/swagger';

export class DebtResponseDto {
  @ApiProperty()
  tipo!: DebtType

  @ApiProperty()
  valor_original!: number

  @ApiProperty()
  valor_atualizado!: number

  @ApiProperty()
  vencimento!: string

  @ApiProperty()
  dias_atraso!: number
}

export class DebtsSummaryDto {
  @ApiProperty()
  total_original!: number

  @ApiProperty()
  total_atualizado!: number
}

export class InstallmentDto {
  @ApiProperty()
  quantidade!: number

  @ApiProperty()
  valor_parcela!: number
}

export class CreditCardPaymentDto {
  @ApiProperty({
    type: InstallmentDto,
    isArray: true,
  })
  parcelas!: InstallmentDto[]
}

export class PixPaymentDto {
  @ApiProperty()
  total_com_desconto!: number
}

export class PaymentOptionDto {
  @ApiProperty()
  tipo!: PaymentType

  @ApiProperty()
  valor_base!: number

  @ApiProperty({
    type: PixPaymentDto,
  })
  pix!: PixPaymentDto

  @ApiProperty({
    type: CreditCardPaymentDto,
  })
  cartao_credito!: CreditCardPaymentDto
}

export class PaymentOptionsDto {
  @ApiProperty({
    type: PaymentOptionDto,
    isArray: true,
  })
  opcoes!: PaymentOptionDto[]
}

export class ConsultDebtsResponseDto {
  @ApiProperty()
  placa!: string

  @ApiProperty({
    type: DebtResponseDto,
    isArray: true,
  })
  debitos!: DebtResponseDto[]

  @ApiProperty({
    type: DebtsSummaryDto,
  })
  resumo!: DebtsSummaryDto

  @ApiProperty({
    type: PaymentOptionsDto,
  })
  pagamentos!: PaymentOptionsDto
}

