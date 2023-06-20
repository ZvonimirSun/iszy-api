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
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { MockService } from './mock.service';
import { CustomAuthGuard } from '../auth/guard/custom-auth.guard';
import { AuthRequest } from '../../core/types/AuthRequest';
import { MockProjDto } from './dtos/mock_proj.dto';
import { MockDataDto } from './dtos/mock_data.dto';
import { ResultDto } from '../../core/dto/result.dto';
import { MockData } from './entities/mock_data.model';
import { MockPrj } from './entities/mock_prj.model';

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
  ): Promise<ResultDto<void>> {
    try {
      await this.mockService.updateMockPrj(
        req.user.userId,
        mockPrjId,
        mockPrjDto,
      );
      return {
        success: true,
        message: '更新mock项目成功',
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
      const mockPrjs = await this.mockService.getMockPrjs(req.user.userId);
      return {
        success: true,
        message: '获取mock项目列表成功',
        data: mockPrjs,
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
    @Param('mockDataId') mockDataId: string,
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
    @Param('mockDataId') mockDataId: string,
    @Body() mockDataDto: MockDataDto,
    @Req() req: AuthRequest,
  ): Promise<ResultDto<void>> {
    try {
      await this.mockService.updateMockData(
        req.user.userId,
        mockDataId,
        mockDataDto,
      );
      return {
        success: true,
        message: '更新mock数据成功',
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
    @Param('mockDataId') mockDataId: string,
    @Req() req: AuthRequest,
  ): Promise<ResultDto<MockData>> {
    try {
      return {
        success: true,
        message: '获取mock数据成功',
        data: await this.mockService.getMockData(mockDataId),
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

  @All('/:mockPrjId/:prjPath/:dataPath')
  async mock(
    @Param('mockPrjId') mockPrjId: string,
    @Param('prjPath') prjPath: string,
    @Param('dataPath') dataPath: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const mockData = await this.mockService.getMockDataByPath(
      mockPrjId,
      prjPath,
      dataPath,
    );
    if (mockData) {
      if (!mockData.enabled) {
        res.status(404);
        return;
      }
      if (mockData.type.toLowerCase() !== req.method.toLowerCase()) {
        res.status(405);
        return;
      }
      let json: string | unknown = mockData.response;
      try {
        json = JSON.parse(mockData.response);
      } catch (e) {}
      if (mockData.delay) {
        await _sleep(mockData.delay);
      }
      return json;
    } else {
      res.status(404);
      return;
    }
  }
}

function _sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
