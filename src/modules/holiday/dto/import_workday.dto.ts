import { ApiProperty } from '@nestjs/swagger';

export class ImportWorkdayDto {
  @ApiProperty()
  readonly date!: number;

  @ApiProperty()
  readonly desc: string;
}
