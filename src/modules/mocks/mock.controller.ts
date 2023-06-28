import {
  All,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { MockService } from './mock.service';
import { CustomAuthGuard } from '../auth/guard/custom-auth.guard';
import { AuthRequest } from '../../core/types/AuthRequest';
import { MockProjDto } from './dtos/mock_proj.dto';
import { MockDataDto } from './dtos/mock_data.dto';
import { ResultDto } from '../../core/dto/result.dto';
import { MockData } from './entities/mock_data.model';
import { MockPrj } from './entities/mock_prj.model';
import Mock from 'mockjs';

@ApiTags('Mock')
@Controller('mock')
export class MockController {
  constructor(private readonly mockService: MockService) {}

  @UseGuards(CustomAuthGuard)
  @Post('api/prj')
  async createMockPrj(
    @Body() mockPrjDto: MockProjDto,
    @Req() req: AuthRequest,
  ): Promise<ResultDto<MockPrj>> {
    try {
      return {
        success: true,
        message: '创建mock项目成功',
        data: await this.mockService.createMockPrj(req.user.userId, mockPrjDto),
      };
    } catch (e) {
      return {
        success: false,
        message: e.message,
      };
    }
  }

  @UseGuards(CustomAuthGuard)
  @Delete('api/prj/:mockPrjId')
  async deleteMockPrj(
    @Param('mockPrjId') mockPrjId: string,
    @Req() req: AuthRequest,
  ): Promise<ResultDto<void>> {
    try {
      await this.mockService.deleteMockPrj(req.user.userId, mockPrjId);
      return {
        success: true,
        message: '删除mock项目成功',
      };
    } catch (e) {
      return {
        success: false,
        message: e.message,
      };
    }
  }

  @UseGuards(CustomAuthGuard)
  @Put('api/prj/:mockPrjId')
  async updateMockPrj(
    @Param('mockPrjId') mockPrjId: string,
    @Body() mockPrjDto: MockProjDto,
    @Req() req: AuthRequest,
  ): Promise<ResultDto<MockPrj>> {
    try {
      return {
        success: true,
        message: '更新mock项目成功',
        data: await this.mockService.updateMockPrj(
          req.user.userId,
          mockPrjId,
          mockPrjDto,
        ),
      };
    } catch (e) {
      return {
        success: false,
        message: e.message,
      };
    }
  }

  @UseGuards(CustomAuthGuard)
  @Get('api/prj/list')
  async getMockPrjs(@Req() req: AuthRequest): Promise<ResultDto<MockPrj[]>> {
    try {
      return {
        success: true,
        message: '获取mock项目列表成功',
        data: await this.mockService.getMockPrjs(req.user.userId),
      };
    } catch (e) {
      return {
        success: false,
        message: e.message,
      };
    }
  }

  @UseGuards(CustomAuthGuard)
  @Get('api/prj/:mockPrjId')
  async getMockPrj(
    @Param('mockPrjId') mockPrjId: string,
    @Req() req: AuthRequest,
  ): Promise<ResultDto<MockPrj>> {
    try {
      return {
        success: true,
        message: '获取mock项目成功',
        data: await this.mockService.getMockPrj(req.user.userId, mockPrjId),
      };
    } catch (e) {
      return {
        success: false,
        message: e.message,
      };
    }
  }

  @UseGuards(CustomAuthGuard)
  @Post('api/data')
  async createMockData(
    @Body() mockDataDto: MockDataDto,
    @Req() req: AuthRequest,
  ): Promise<ResultDto<MockData>> {
    try {
      if (typeof mockDataDto.response !== 'string') {
        mockDataDto.response = JSON.stringify(mockDataDto.response);
      }
      return {
        success: true,
        message: '创建mock数据成功',
        data: await this.mockService.createMockData(
          req.user.userId,
          mockDataDto,
        ),
      };
    } catch (e) {
      return {
        success: false,
        message: e.message,
      };
    }
  }

  @UseGuards(CustomAuthGuard)
  @Delete('api/data/:mockDataId')
  async deleteMockData(
    @Param('mockDataId', ParseIntPipe) mockDataId: number,
    @Req() req: AuthRequest,
  ): Promise<ResultDto<void>> {
    try {
      await this.mockService.deleteMockData(req.user.userId, mockDataId);
      return {
        success: true,
        message: '删除mock数据成功',
      };
    } catch (e) {
      return {
        success: false,
        message: e.message,
      };
    }
  }

  @UseGuards(CustomAuthGuard)
  @Put('api/data/:mockDataId')
  async updateMockData(
    @Param('mockDataId', ParseIntPipe) mockDataId: number,
    @Body() mockDataDto: MockDataDto,
    @Req() req: AuthRequest,
  ): Promise<ResultDto<MockData>> {
    try {
      if (typeof mockDataDto.response !== 'string') {
        mockDataDto.response = JSON.stringify(mockDataDto.response);
      }
      return {
        success: true,
        message: '更新mock数据成功',
        data: await this.mockService.updateMockData(
          req.user.userId,
          mockDataId,
          mockDataDto,
        ),
      };
    } catch (e) {
      return {
        success: false,
        message: e.message,
      };
    }
  }

  @UseGuards(CustomAuthGuard)
  @Get('api/data/:mockDataId')
  async getMockData(
    @Param('mockDataId', ParseIntPipe) mockDataId: number,
    @Req() req: AuthRequest,
  ): Promise<ResultDto<MockData>> {
    try {
      return {
        success: true,
        message: '获取mock数据成功',
        data: await this.mockService.getMockData(req.user.userId, mockDataId),
      };
    } catch (e) {
      return {
        success: false,
        message: e.message,
      };
    }
  }

  @UseGuards(CustomAuthGuard)
  @Get('api/prj/:mockPrjId/list')
  async getMockDatas(
    @Req() req: AuthRequest,
    @Param('mockPrjId') mockPrjId: string,
  ): Promise<ResultDto<MockData[]>> {
    try {
      return {
        success: true,
        message: '获取mock数据列表成功',
        data: await this.mockService.getMockDatas(req.user.userId, mockPrjId),
      };
    } catch (e) {
      return {
        success: false,
        message: e.message,
      };
    }
  }

  @UseGuards(CustomAuthGuard)
  @Get('api/path/:prjPath')
  async getMockPrjByPath(
    @Param('prjPath') prjPath: string,
    @Req() req: AuthRequest,
  ): Promise<ResultDto<MockPrj>> {
    try {
      return {
        success: true,
        message: '获取mock项目成功',
        data: await this.mockService.getMockPrjByPath(req.user.userId, prjPath),
      };
    } catch (e) {
      return {
        success: false,
        message: e.message,
      };
    }
  }

  @ApiParam({
    name: '0',
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
  @All('/:mockPrjId/:prjPath/*')
  async mock(
    @Param()
    params: {
      mockPrjId: string;
      prjPath: string;
      '0': string;
    },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { mockPrjId, prjPath, '0': dataPath } = params;
    if (!dataPath) {
      res.status(404);
      return;
    }
    let mockData;
    try {
      mockData = await this.mockService.getMockDataByPath(
        mockPrjId,
        prjPath,
        dataPath,
      );
    } catch (e) {
      res.status(404);
      return;
    }
    if (!mockData.enabled) {
      res.status(404);
      return;
    }
    if (mockData.type.toLowerCase() !== req.method.toLowerCase()) {
      res.status(405);
      return;
    }
    let json: any = mockData.response;
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
      };
      const tmp: unknown = new Function('return ' + mockData.response)();
      const tmp1 = JSON.stringify(tmp, function (key, value) {
        if (typeof value === 'function') {
          try {
            return value.call(undefined, {
              _req: _req,
              Mock,
            });
          } catch (e) {
            return undefined;
          }
        }
        return value;
      });
      json = Mock.mock(JSON.parse(tmp1));
    } catch (e) {
      console.log(e);
    }
    if (mockData.delay) {
      await _sleep(mockData.delay);
    }
    const responseStatus = req.header('response-status');
    if (responseStatus != null) {
      res.status(parseInt(responseStatus));
    }
    return json;
  }
}

function _sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
