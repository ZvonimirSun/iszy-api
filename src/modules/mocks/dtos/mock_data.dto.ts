import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MockDataDto {
  @ApiProperty({
    description: '数据名称',
  })
  readonly name!: string;

  @ApiProperty({
    description: '请求类型',
  })
  readonly type!: string;

  @ApiProperty({
    description: '是否启用',
  })
  readonly enabled!: boolean;

  @ApiProperty({
    description: '请求路径',
  })
  readonly path!: string;

  @ApiPropertyOptional({
    description: '数据描述',
  })
  readonly description?: string;

  @ApiPropertyOptional({
    description: '延迟时间',
  })
  readonly delay?: number;

  @ApiPropertyOptional({
    description: '响应数据',
  })
  readonly response?: string;

  @ApiProperty({
    description: '项目id',
  })
  readonly projectId!: string;
}
