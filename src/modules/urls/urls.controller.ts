import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Redirect,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UrlsService } from './urls.service';
import { Request } from 'express';
import { CreateDto } from './dto/create.dto';
import { ResultDto } from '../../core/result.dto';
import { AuthGuard } from '@nestjs/passport';
import { PaginationQueryDto } from './dto/pagination_query.dto';

@ApiTags('Tools/Urls')
@Controller('tools/urls')
export class UrlsController {
  constructor(private readonly urlsService: UrlsService) {}

  @Get('admin')
  adminPage() {
    return null;
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('create')
  async createUrl(
    @Body() createDto: CreateDto,
    @Req() req: Request,
  ): Promise<ResultDto> {
    if (createDto.keyword !== 'admin') {
      const status = await this.urlsService.createUrl(
        req,
        createDto.url,
        createDto.title,
        createDto.keyword,
      );
      return {
        success: status,
        message: status ? '创建成功' : '创建失败',
      };
    } else {
      return {
        success: false,
        message: '创建失败',
      };
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('getUrlList')
  async getUrlList(
    @Query() paginationQueryDto: PaginationQueryDto,
  ): Promise<ResultDto> {
    const data = await this.urlsService.getUrlList(
      paginationQueryDto.pageIndex,
      paginationQueryDto.pageSize,
    );
    if (data) {
      return {
        success: true,
        message: '获取成功',
        data,
      };
    } else {
      return {
        success: false,
        message: '获取失败',
      };
    }
  }

  @Get(':keyword')
  @Redirect()
  async visitUrl(@Param('keyword') keyword: string, @Req() req: Request) {
    const url = await this.urlsService.visitUrl(keyword, req);
    if (url) {
      return { url, statusCode: 302 };
    } else {
      return { statusCode: 403 };
    }
  }
}
