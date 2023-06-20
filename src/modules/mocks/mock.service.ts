import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MockPrj } from './entities/mock_prj.model';
import { MockData } from './entities/mock_data.model';
import { Sequelize } from 'sequelize-typescript';
import { MockProjDto } from './dtos/mock_proj.dto';
import { MockDataDto } from './dtos/mock_data.dto';
import mock = jest.mock;

@Injectable()
export class MockService {
  constructor(
    @InjectModel(MockPrj) private mockPrjModel: typeof MockPrj,
    @InjectModel(MockData) private mockDataModel: typeof MockData,
    private sequelize: Sequelize,
  ) {}

  async createMockPrj(userId: number, mockPrjDto: MockProjDto) {
    if (mockPrjDto.name && mockPrjDto.path) {
      await this.mockPrjModel.create({
        ...mockPrjDto,
        userId,
        id: undefined,
      });
    } else {
      throw new Error('name and path are required');
    }
  }

  async deleteMockPrj(userId: number, mockPrjId: string) {
    await this.sequelize.transaction(async (t) => {
      const transactionHost = { transaction: t };
      const mockPrj = await this.mockPrjModel.findOne({
        where: { userId, id: mockPrjId },
      });
      if (!mockPrj) {
        throw new Error('mock project not found');
      } else {
        await this.mockDataModel.destroy({
          where: { projectId: mockPrjId },
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
    mockPrjDto: MockProjDto,
  ) {
    await this.mockPrjModel.update(mockPrjDto, {
      where: { userId, id: mockPrjId },
    });
  }

  async getMockPrj(userId: number, mockPrjId: string) {
    return this.mockPrjModel.findOne({
      where: { userId, id: mockPrjId },
    });
  }

  async getMockPrjs(userId: number) {
    return this.mockPrjModel.findAll({ where: { userId } });
  }

  async createMockData(userId: number, mockDataDto: MockDataDto) {
    await this.sequelize.transaction(async (t) => {
      const transactionHost = { transaction: t };
      const mockPrj = await this.mockPrjModel.findOne({
        where: { userId, id: mockDataDto.projectId },
      });
      if (!mockPrj) {
        throw new Error('mock project not found');
      } else {
        await this.mockDataModel.create(
          { ...mockDataDto, id: undefined },
          transactionHost,
        );
      }
    });
  }

  async deleteMockData(userId: number, mockDataId: string) {
    await this.sequelize.transaction(async (t) => {
      const transactionHost = { transaction: t };
      const mockData = await this.mockDataModel.findOne({
        where: { id: mockDataId },
      });
      if (!mockData) {
        throw new Error('mock data not found');
      } else {
        const mockPrj = await this.mockPrjModel.findOne({
          where: { userId, id: mockData.projectId },
        });
        if (!mockPrj) {
          throw new Error('mock data not found');
        } else {
          await this.mockDataModel.destroy({
            where: { id: mockDataId },
            ...transactionHost,
          });
        }
      }
    });
  }

  async updateMockData(
    userId: number,
    mockDataId: string,
    mockDataDto: MockDataDto,
  ) {
    await this.sequelize.transaction(async (t) => {
      const transactionHost = { transaction: t };
      const mockData = await this.mockDataModel.findOne({
        where: { id: mockDataId },
      });
      if (!mockData) {
        throw new Error('mock data not found');
      } else {
        const mockPrj = await this.mockPrjModel.findOne({
          where: { userId, id: mockData.projectId },
        });
        if (!mockPrj) {
          throw new Error('mock data not found');
        } else {
          await this.mockDataModel.update(mockDataDto, {
            where: { id: mockDataId },
            ...transactionHost,
          });
        }
      }
    });
  }

  async getMockData(mockDataId: string) {
    return await this.mockDataModel.findOne({ where: { id: mockDataId } });
  }

  async getMockDataByPath(
    mockPrjId: string,
    mockPath: string,
    dataPath: string,
  ) {
    const mockPrj = await this.mockPrjModel.findOne({
      where: { id: mockPrjId, path: '/' + mockPath },
    });
    if (!mockPrj) {
      throw new Error('mock project not found');
    } else {
      return this.mockDataModel.findOne({
        where: { projectId: mockPrjId, path: '/' + dataPath },
      });
    }
  }

  async getMockDatas(userId: number, mockPrjId: string) {
    const mockPrj = await this.mockPrjModel.findOne({
      where: { userId, id: mockPrjId },
    });
    if (!mockPrj) {
      throw new Error('mock project not found');
    } else {
      return this.mockDataModel.findAll({
        where: { projectId: mockPrjId },
      });
    }
  }
}
