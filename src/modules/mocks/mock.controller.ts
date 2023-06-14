import { Body, Controller, Get, Header, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MockService } from './mock.service';

@ApiTags('Tools/Holiday')
@Controller('tools/holiday')
export class MockController {
  constructor(private readonly mockService: MockService) {}
}
