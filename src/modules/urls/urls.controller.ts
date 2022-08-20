import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Redirect,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { UrlsService } from './urls.service';
import { Request, Response } from 'express';
import { CreateDto } from './dto/create.dto';
import { ResultDto } from '../../core/result.dto';
import { AuthGuard } from '@nestjs/passport';
import { PaginationQueryDto } from './dto/pagination_query.dto';
import { UpdateDto } from './dto/update.dto';

@ApiTags('Tools/Urls')
@Controller('tools/urls')
export class UrlsController {
  constructor(private readonly urlsService: UrlsService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('admin/url')
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

  @Get('admin/url/:keyword')
  async readUrl(@Param('keyword') keyword: string): Promise<ResultDto> {
    const data = await this.urlsService.readUrl(keyword);
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

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Put('admin/url/:keyword')
  async updateUrl(
    @Param('keyword') keyword: string,
    @Body() updateDto: UpdateDto,
  ) {
    const status = await this.urlsService.updateUrl(
      keyword,
      updateDto.url,
      updateDto.title,
    );
    return {
      success: status,
      message: status ? '更新成功' : '更新失败',
    };
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Delete('admin/url/:keyword')
  async deleteUrl(@Param('keyword') keyword: string) {
    const status = await this.urlsService.deleteUrl(keyword);
    return {
      success: status,
      message: status ? '删除成功' : '删除失败',
    };
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/manage/getUrlList')
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

  @Get('admin')
  adminPage() {
    return null;
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

  @Get()
  rootPage(@Res() res: Response) {
    res.sendStatus(403);
  }
}
