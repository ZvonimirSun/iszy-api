import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MockData } from '~entities/mocks/mock_data.model';
import { MockPrj } from '~entities/mocks/mock_prj.model';
import { MockController } from './mock.controller';
import { MockService } from './mock.service';

@Module({
  imports: [SequelizeModule.forFeature([MockPrj, MockData])],
  controllers: [MockController],
  providers: [MockService],
  exports: [MockService],
})
export class MockModule {}
