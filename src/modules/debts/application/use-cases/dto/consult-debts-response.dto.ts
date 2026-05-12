import { DebtType, PaymentType } from "../enums/debt-type.enum"

export class DebtResponseDto {
  tipo!: DebtType
  valor_original!: number
  valor_atualizado!: number
  vencimento!: string
  dias_atraso!: number
}

export class DebtsSummaryDto {
  total_original!: number
  total_atualizado!: number
}

export class InstallmentDto {
  quantidade!: number
  valor_parcela!: number
}

export class CreditCardPaymentDto {
  parcelas!: InstallmentDto[]
}

export class PixPaymentDto {
  total_com_desconto!: number
}

export class PaymentOptionDto {
  tipo!: PaymentType
  valor_base!: number
  pix!: PixPaymentDto
  cartao_credito!: CreditCardPaymentDto
}

export class PaymentOptionsDto {
  opcoes!: PaymentOptionDto[]
}

export class ConsultDebtsResponseDto {
  placa!: string
  debitos!: DebtResponseDto[]
  resumo!: DebtsSummaryDto
  pagamentos!: PaymentOptionsDto
}

