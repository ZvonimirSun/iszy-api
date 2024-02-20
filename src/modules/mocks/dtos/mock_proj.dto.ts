import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class MockProjDto {
  @ApiProperty({
    description: '项目名称',
  })
  readonly name!: string

  @ApiProperty({
    description: '项目路径',
  })
  readonly path!: string

  @ApiPropertyOptional({
    description: '项目描述',
  })
  readonly description?: string
}
