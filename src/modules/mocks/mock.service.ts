import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MockPrj } from './entities/mock_prj.model';
import { MockData } from './entities/mock_data.model';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class MockService {
  constructor(
    @InjectModel(MockPrj) private mockPrjModel: typeof MockPrj,
    @InjectModel(MockData) private mockDataModel: typeof MockData,
    private sequelize: Sequelize,
  ) {}
}
