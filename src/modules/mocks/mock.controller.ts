import type { Request, Response } from 'express'
import type { ResultDto } from '~core/dto/result.dto'
import type { MockData } from '~entities/mocks/mock_data.model'
import type { MockPrj } from '~entities/mocks/mock_prj.model'
import type { AuthRequest } from '~types/AuthRequest'
import type { MockDataDto } from './dtos/mock_data.dto'
import type { MockProjDto } from './dtos/mock_proj.dto'
import {
  All,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common'
import { ApiParam, ApiTags } from '@nestjs/swagger'
import Mock from 'mockjs'
import { Public } from '~core/decorator/public.decorator'
import { AuthGuard } from '~core/guard/custom-auth.guard'
import { MockService } from './mock.service'

@ApiTags('Mock')
@UseGuards(AuthGuard)
@Controller('mock')
export class MockController {
  constructor(private readonly mockService: MockService) {}

  @Post('api/prj')
  async createMockPrj(
    @Body() mockPrjDto: MockProjDto,
    @Req() req: AuthRequest,
  ): Promise<ResultDto<MockPrj>> {
    return {
      success: true,
      message: '创建mock项目成功',
      data: await this.mockService.createMockPrj(req.user.userId, mockPrjDto),
    }
  }

  @Delete('api/prj/:mockPrjId')
  async deleteMockPrj(
    @Param('mockPrjId') mockPrjId: string,
    @Req() req: AuthRequest,
  ): Promise<ResultDto<void>> {
    await this.mockService.deleteMockPrj(req.user.userId, mockPrjId)
    return {
      success: true,
      message: '删除mock项目成功',
    }
  }

  @Put('api/prj/:mockPrjId')
  async updateMockPrj(
    @Param('mockPrjId') mockPrjId: string,
    @Body() mockPrjDto: MockProjDto,
    @Req() req: AuthRequest,
  ): Promise<ResultDto<MockPrj>> {
    return {
      success: true,
      message: '更新mock项目成功',
      data: await this.mockService.updateMockPrj(
        req.user.userId,
        mockPrjId,
        _normalizeDto(mockPrjDto),
      ),
    }
  }

  @Get('api/prj/list')
  async getMockPrjs(@Req() req: AuthRequest): Promise<ResultDto<MockPrj[]>> {
    return {
      success: true,
      message: '获取mock项目列表成功',
      data: await this.mockService.getMockPrjs(req.user.userId),
    }
  }

  @Get('api/prj/:mockPrjId')
  async getMockPrj(
    @Param('mockPrjId') mockPrjId: string,
    @Req() req: AuthRequest,
  ): Promise<ResultDto<MockPrj>> {
    return {
      success: true,
      message: '获取mock项目成功',
      data: await this.mockService.getMockPrj(req.user.userId, mockPrjId),
    }
  }

  @Post('api/data')
  async createMockData(
    @Body() mockDataDto: MockDataDto,
    @Req() req: AuthRequest,
  ): Promise<ResultDto<MockData>> {
    if (typeof mockDataDto.response !== 'string')
      mockDataDto.response = JSON.stringify(mockDataDto.response)

    return {
      success: true,
      message: '创建mock数据成功',
      data: await this.mockService.createMockData(
        req.user.userId,
        _normalizeDto(mockDataDto),
      ),
    }
  }

  @Delete('api/data/:mockDataId')
  async deleteMockData(
    @Param('mockDataId') mockDataId: number,
    @Req() req: AuthRequest,
  ): Promise<ResultDto<void>> {
    await this.mockService.deleteMockData(req.user.userId, mockDataId)
    return {
      success: true,
      message: '删除mock数据成功',
    }
  }

  @Put('api/data/:mockDataId')
  async updateMockData(
    @Param('mockDataId') mockDataId: number,
    @Body() mockDataDto: MockDataDto,
    @Req() req: AuthRequest,
  ): Promise<ResultDto<MockData>> {
    if (typeof mockDataDto.response !== 'string')
      mockDataDto.response = JSON.stringify(mockDataDto.response)

    return {
      success: true,
      message: '更新mock数据成功',
      data: await this.mockService.updateMockData(
        req.user.userId,
        mockDataId,
        _normalizeDto(mockDataDto),
      ),
    }
  }

  @Get('api/data/:mockDataId')
  async getMockData(
    @Param('mockDataId') mockDataId: number,
    @Req() req: AuthRequest,
  ): Promise<ResultDto<MockData>> {
    return {
      success: true,
      message: '获取mock数据成功',
      data: await this.mockService.getMockData(req.user.userId, mockDataId),
    }
  }

  @Get('api/prj/:mockPrjId/list')
  async getMockDatas(
    @Req() req: AuthRequest,
    @Param('mockPrjId') mockPrjId: string,
  ): Promise<ResultDto<MockData[]>> {
    return {
      success: true,
      message: '获取mock数据列表成功',
      data: await this.mockService.getMockDatas(req.user.userId, mockPrjId),
    }
  }

  @Get('api/path/:prjPath')
  async getMockPrjByPath(
    @Param('prjPath') prjPath: string,
    @Req() req: AuthRequest,
  ): Promise<ResultDto<MockPrj>> {
    return {
      success: true,
      message: '获取mock项目成功',
      data: await this.mockService.getMockPrjByPath(req.user.userId, prjPath),
    }
  }

  @ApiParam({
    name: 'dataPath',
    description: 'mock数据路径',
  })
  @ApiParam({
    name: 'prjPath',
    description: 'mock项目路径',
  })
  @ApiParam({
    name: 'mockPrjId',
    description: 'mock项目id',
  })
  @Public()
  @All('/:mockPrjId/:prjPath/*dataPath')
  async mock(
    @Param('mockPrjId') mockPrjId: string,
    @Param('prjPath') prjPath: string,
    @Param('dataPath') dataPath: string[],
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!dataPath || !dataPath.length) {
      res.status(404)
      return
    }
    let mockData: MockData
    try {
      mockData = await this.mockService.getMockDataByPath(
        mockPrjId,
        `/${prjPath}`,
        `/${dataPath.join('/')}`,
      )
    }
    catch (e) {
      res.status(404)
      return
    }
    if (!mockData.enabled) {
      res.status(404)
      return
    }
    if (mockData.type.toLowerCase() !== 'all' && mockData.type.toLowerCase() !== req.method.toLowerCase()) {
      res.status(405)
      return
    }
    let json: any = mockData.response
    try {
      const _req = {
        url: req.url,
        method: req.method,
        params: req.params,
        query: req.query,
        body: req.body,
        path: req.path,
        headers: req.headers,
        originalUrl: req.originalUrl,
        hostname: req.hostname,
        protocol: req.protocol,
        ip: req.ip,
        cookies: req.cookies,
        signedCookies: req.signedCookies,
        header: req.header,
      }
      const tmp: unknown = new Function(`return ${mockData.response}`)()
      const tmp1 = JSON.stringify(tmp, (key, value) => {
        if (typeof value === 'function') {
          try {
            return value.call(undefined, {
              _req,
              Mock,
            })
          }
          catch (e) {
            return undefined
          }
        }
        return value
      })
      json = Mock.mock(JSON.parse(tmp1))
    }
    catch (e) {
      console.log(e)
    }
    if (mockData.delay)
      await _sleep(mockData.delay)

    const responseStatus = req.header('response-status')
    if (responseStatus != null)
      res.status(Number.parseInt(responseStatus))

    return json
  }
}

function _sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function _normalizeDto<T extends MockProjDto | MockDataDto>(dto: T): T {
  if (dto.path) {
    dto.path = dto.path.trim()
    if (!dto.path) {
      delete dto.path
    }
    else {
      if (dto.path === '/') {
        throw new Error('根路径不允许使用')
      }
      if (!dto.path.startsWith('/')) {
        dto.path = `/${dto.path}`
      }
      // 不允许出现连续的斜杠
      dto.path = dto.path.replace(/\/+/g, '/')
    }
  }
  if (dto.name) {
    dto.name = dto.name.trim()
    if (!dto.name) {
      delete dto.name
    }
  }
  return dto
}
