import { ApiProperty } from '@nestjs/swagger';

export class ImportHolidayDto {
  @ApiProperty()
  readonly startDate!: number;

  @ApiProperty()
  readonly endDate!: number;

  @ApiProperty()
  readonly desc: string;
}
