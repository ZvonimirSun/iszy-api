import type { MockDataDto } from './dtos/mock_data.dto'
import type { MockProjDto } from './dtos/mock_proj.dto'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { Sequelize } from 'sequelize-typescript'
import { MockData } from '~entities/mocks/mock_data.model'
import { MockPrj } from '~entities/mocks/mock_prj.model'

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
    if (!mockPrjDto.name || !mockPrjDto.path) {
      throw new Error('必须指定名称和路径')
    }
    if (mockPrjDto.path === '/') {
      throw new Error('根路径不允许使用')
    }

    return await this.mockPrjModel.create({
      ...mockPrjDto,
      userId,
      id: undefined,
    })
  }

  async deleteMockPrj(userId: number, mockPrjId: string): Promise<void> {
    const mockPrj = await this.mockPrjModel.findByPk(mockPrjId)
    if (!mockPrj || mockPrj.userId !== userId) {
      throw new Error('Mock项目不存在')
    }
    await this.sequelize.transaction(async (t) => {
      const transactionHost = { transaction: t }
      await this.mockDataModel.destroy({
        where: { userId, projectId: mockPrjId },
        ...transactionHost,
      })
      await this.mockPrjModel.destroy({
        where: { userId, id: mockPrjId },
        ...transactionHost,
      })
    })
  }

  async updateMockPrj(
    userId: number,
    mockPrjId: string,
    mockPrjDto: Partial<MockProjDto>,
  ): Promise<MockPrj> {
    if (mockPrjDto.path != null) {
      if (mockPrjDto.path === '/') {
        throw new Error('根路径不允许使用')
      }
    }
    const mockPrj = await this.mockPrjModel.findByPk(mockPrjId)
    if (!mockPrj || mockPrj.userId !== userId) {
      throw new Error('Mock项目不存在')
    }
    return await mockPrj.update(mockPrjDto)
  }

  async getMockPrj(userId: number, mockPrjId: string): Promise<MockPrj> {
    const mockPrj = await this.mockPrjModel.findByPk(mockPrjId)
    if (!mockPrj || mockPrj.userId !== userId) {
      throw new Error('Mock项目不存在')
    }
    return mockPrj
  }

  async getMockPrjByPath(userId: number, path: string): Promise<MockPrj> {
    const mockPrj = await this.mockPrjModel.findOne({
      where: { userId, path },
    })
    if (!mockPrj) {
      throw new Error('Mock项目不存在')
    }
    return mockPrj
  }

  async getMockPrjs(userId: number): Promise<MockPrj[]> {
    return this.mockPrjModel.findAll({ where: { userId } })
  }

  async createMockData(
    userId: number,
    mockDataDto: MockDataDto,
  ): Promise<MockData> {
    if (!mockDataDto.name || !mockDataDto.path) {
      throw new Error('必须指定名称和路径')
    }
    if (mockDataDto.path === '/') {
      throw new Error('根路径不允许使用')
    }
    if (mockDataDto.delay && mockDataDto.delay > 60 * 1000) {
      throw new Error('延迟时间不能超过60秒')
    }
    const mockPrj = await this.mockPrjModel.findByPk(mockDataDto.projectId)
    if (!mockPrj || mockPrj.userId !== userId) {
      throw new Error('Mock项目不存在')
    }
    const mockData = await this.mockDataModel.findOne({
      where: {
        userId,
        path: mockDataDto.path,
        projectId: mockDataDto.projectId,
      },
    })
    if (mockData) {
      throw new Error('Mock数据路径已存在')
    }
    return await this.mockDataModel.create({
      ...mockDataDto,
      userId,
      id: undefined,
    })
  }

  async deleteMockData(userId: number, mockDataId: number): Promise<void> {
    const mockData = await this.mockDataModel.findByPk(mockDataId)
    if (!mockData || mockData.userId !== userId) {
      throw new Error('Mock数据不存在')
    }
    await mockData.destroy()
  }

  async updateMockData(
    userId: number,
    mockDataId: number,
    mockDataDto: Partial<MockDataDto>,
  ): Promise<MockData> {
    if (mockDataDto.path) {
      if (mockDataDto.path === '/') {
        throw new Error('根路径不允许使用')
      }
    }
    if (mockDataDto.delay && mockDataDto.delay > 60 * 1000) {
      throw new Error('延迟时间不能超过60秒')
    }
    const mockData = await this.mockDataModel.findByPk(mockDataId)
    if (!mockData || mockData.userId !== userId) {
      throw new Error('Mock数据不存在')
    }
    if (mockDataDto.path) {
      const mockData2 = await this.mockDataModel.findOne({
        where: {
          userId,
          path: mockDataDto.path,
          projectId: mockData.projectId,
        },
      })
      if (mockData2 && mockData2.id !== mockDataId) {
        throw new Error('Mock数据路径已存在')
      }
    }
    const { projectId, ...other } = mockDataDto
    return await mockData.update(other)
  }

  async getMockData(userId: number, mockDataId: number): Promise<MockData> {
    const mockData = await this.mockDataModel.findByPk(mockDataId)
    if (!mockData || mockData.userId !== userId) {
      throw new Error('Mock数据不存在')
    }
    return mockData
  }

  async getMockDataByPath(
    mockPrjId: string,
    mockPath: string,
    dataPath: string,
  ): Promise<MockData> {
    const mockPrj = await this.mockPrjModel.findByPk(mockPrjId)
    if (!mockPrj) {
      throw new Error('Mock项目不存在')
    }
    if (mockPath !== mockPrj.path) {
      throw new Error('Mock项目路径错误')
    }
    const mockData = await this.mockDataModel.findOne({
      where: { projectId: mockPrjId, path: dataPath },
    })
    if (!mockData) {
      throw new Error('Mock数据不存在')
    }
    return mockData
  }

  async getMockDatas(userId: number, mockPrjId: string): Promise<MockData[]> {
    return this.mockDataModel.findAll({
      where: { projectId: mockPrjId, userId },
    })
  }
}
