import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MockPrj } from './entities/mock_prj.model';
import { MockData } from './entities/mock_data.model';
import { Sequelize } from 'sequelize-typescript';
import { MockProjDto } from './dtos/mock_proj.dto';
import { MockDataDto } from './dtos/mock_data.dto';

@Injectable()
export class MockService {
  constructor(
    @InjectModel(MockPrj) private mockPrjModel: typeof MockPrj,
    @InjectModel(MockData) private mockDataModel: typeof MockData,
    private sequelize: Sequelize,
  ) {}

  async createMockPrj(
    userId: number,
    mockPrjDto: MockProjDto,
  ): Promise<MockPrj> {
    if (mockPrjDto.name && mockPrjDto.path) {
      if (mockPrjDto.path === '/') {
        throw new Error('path can not be /');
      }
      return await this.mockPrjModel.create({
        ...mockPrjDto,
        userId,
        id: undefined,
      });
    } else {
      throw new Error('name and path are required');
    }
  }

  async deleteMockPrj(userId: number, mockPrjId: string): Promise<void> {
    await this.sequelize.transaction(async (t) => {
      const transactionHost = { transaction: t };
      const mockPrj = await this.mockPrjModel.findOne({
        where: { userId, id: mockPrjId },
      });
      if (!mockPrj) {
        throw new Error('mock project not found');
      } else {
        await this.mockDataModel.destroy({
          where: { userId, projectId: mockPrjId },
          ...transactionHost,
        });
        await this.mockPrjModel.destroy({
          where: { userId, id: mockPrjId },
          ...transactionHost,
        });
      }
    });
  }

  async updateMockPrj(
    userId: number,
    mockPrjId: string,
    mockPrjDto: Partial<MockProjDto>,
  ): Promise<MockPrj> {
    return await this.sequelize.transaction(async (t) => {
      const transactionHost = { transaction: t };
      const mockPrj = await this.mockPrjModel.findOne({
        where: { userId, id: mockPrjId },
      });
      if (mockPrj) {
        if (mockPrjDto.path && mockPrjDto.path === '/') {
          throw new Error('path can not be /');
        }
        return await mockPrj.update(mockPrjDto, transactionHost);
      } else {
        throw new Error('mock project not found');
      }
    });
  }

  async getMockPrj(userId: number, mockPrjId: string): Promise<MockPrj> {
    const mockPrj = await this.mockPrjModel.findOne({
      where: { userId, id: mockPrjId },
    });
    if (mockPrj) {
      return mockPrj;
    } else {
      throw new Error('mock project not found');
    }
  }

  async getMockPrjByPath(userId: number, path: string): Promise<MockPrj> {
    const mockPrj = await this.mockPrjModel.findOne({
      where: { userId, path: '/' + path },
    });
    if (mockPrj) {
      return mockPrj;
    } else {
      throw new Error('mock project not found');
    }
  }

  async getMockPrjs(userId: number): Promise<MockPrj[]> {
    return this.mockPrjModel.findAll({ where: { userId } });
  }

  async createMockData(
    userId: number,
    mockDataDto: MockDataDto,
  ): Promise<MockData> {
    return await this.sequelize.transaction(async (t) => {
      const transactionHost = { transaction: t };
      const mockPrj = await this.mockPrjModel.findOne({
        where: { userId, id: mockDataDto.projectId },
      });
      if (!mockPrj) {
        throw new Error('mock project not found');
      } else {
        if (
          mockDataDto.path &&
          mockDataDto.name &&
          (!mockDataDto.delay || mockDataDto.delay < 60)
        ) {
          const mockData = await this.mockDataModel.findOne({
            where: { userId, path: mockDataDto.path },
          });
          if (!mockData) {
            return await this.mockDataModel.create(
              { ...mockDataDto, userId, id: undefined },
              transactionHost,
            );
          } else {
            throw new Error('mock data path already exists');
          }
        } else {
          throw new Error('mock data invalid');
        }
      }
    });
  }

  async deleteMockData(userId: number, mockDataId: number): Promise<void> {
    await this.sequelize.transaction(async (t) => {
      const transactionHost = { transaction: t };
      const mockData = await this.mockDataModel.findOne({
        where: { id: mockDataId, userId },
      });
      if (!mockData) {
        throw new Error('mock data not found');
      } else {
        await this.mockDataModel.destroy({
          where: { id: mockDataId, userId },
          ...transactionHost,
        });
      }
    });
  }

  async updateMockData(
    userId: number,
    mockDataId: number,
    mockDataDto: Partial<MockDataDto>,
  ): Promise<MockData> {
    return await this.sequelize.transaction(async (t) => {
      const transactionHost = { transaction: t };
      const mockData = await this.mockDataModel.findOne({
        where: { id: mockDataId, userId },
      });
      if (!mockData) {
        throw new Error('mock data not found');
      } else {
        if (!mockDataDto.delay || mockDataDto.delay < 60) {
          if (mockDataDto.path) {
            const mockData2 = await this.mockDataModel.findOne({
              where: { userId, path: mockDataDto.path },
            });
            if (mockData2 && mockData2.id !== mockDataId) {
              throw new Error('mock data path already exists');
            }
          }
          return await mockData.update(mockDataDto, transactionHost);
        } else {
          throw new Error('mock data invalid');
        }
      }
    });
  }

  async getMockData(userId: number, mockDataId: number): Promise<MockData> {
    const mockData = await this.mockDataModel.findOne({
      where: { id: mockDataId, userId },
    });
    if (mockData) {
      return mockData;
    } else {
      throw new Error('mock data not found');
    }
  }

  async getMockDataByPath(
    mockPrjId: string,
    mockPath: string,
    dataPath: string,
  ): Promise<MockData> {
    const mockPrj = await this.mockPrjModel.findOne({
      where: { id: mockPrjId, path: '/' + mockPath },
    });
    if (!mockPrj) {
      throw new Error('mock project not found');
    } else {
      const mockData = await this.mockDataModel.findOne({
        where: { projectId: mockPrjId, path: '/' + dataPath },
      });
      if (mockData) {
        return mockData;
      } else {
        throw new Error('mock data not found');
      }
    }
  }

  async getMockDatas(userId: number, mockPrjId: string): Promise<MockData[]> {
    return this.mockDataModel.findAll({
      where: { projectId: mockPrjId, userId },
    });
  }
}
