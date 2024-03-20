import { IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import type { Express } from 'express'

export class ImportMockPrjDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  @IsNotEmpty()
  file: Express.Multer.File
}
