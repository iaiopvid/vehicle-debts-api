import { ApiProperty } from "@nestjs/swagger"

export class Error400ResponseDto {
  @ApiProperty()
  message: string[]

  @ApiProperty()
  error: string

  @ApiProperty()
  statusCode: number
}