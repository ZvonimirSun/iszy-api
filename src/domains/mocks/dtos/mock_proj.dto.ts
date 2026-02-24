import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class MockProjDto {
  @ApiProperty({
    description: '项目名称',
  })
  name: string

  @ApiProperty({
    description: '项目路径',
  })
  path: string

  @ApiPropertyOptional({
    description: '项目描述',
  })
  readonly description?: string
}
