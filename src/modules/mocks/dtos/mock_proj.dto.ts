import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MockProjDto {
  @ApiPropertyOptional({
    description: '项目id',
  })
  id?: string;

  @ApiProperty({
    description: '项目名称',
  })
  readonly name!: string;

  @ApiProperty({
    description: '项目路径',
  })
  readonly path!: string;

  @ApiPropertyOptional({
    description: '项目描述',
  })
  readonly description?: string;
}
