import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { UrlsService } from './urls.service';
import { Request, Response } from 'express';
import { CreateDto } from './dto/create.dto';
import { ResultDto } from '../../core/result.dto';
import { PaginationQueryDto } from './dto/pagination_query.dto';
import { UpdateDto } from './dto/update.dto';
import { UrlModel } from './entities/url.model';
import { PaginationDto } from '../../core/pagination.dto';
import { CustomAuthGuard } from '../auth/guard/custom-auth.guard';

@ApiTags('Tools/Urls')
@Controller('tools/urls')
export class UrlsController {
  constructor(private readonly urlsService: UrlsService) {}

  @ApiCookieAuth()
  @UseGuards(CustomAuthGuard)
  @Post('admin/url')
  async createUrl(
    @Body() createDto: CreateDto,
    @Req() req: Request,
  ): Promise<ResultDto<null>> {
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
  async readUrl(
    @Param('keyword') keyword: string,
  ): Promise<ResultDto<UrlModel>> {
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

  @ApiCookieAuth()
  @UseGuards(CustomAuthGuard)
  @Put('admin/url/:keyword')
  async updateUrl(
    @Param('keyword') keyword: string,
    @Body() updateDto: UpdateDto,
  ): Promise<ResultDto<null>> {
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

  @ApiCookieAuth()
  @UseGuards(CustomAuthGuard)
  @Delete('admin/url/:keyword')
  async deleteUrl(@Param('keyword') keyword: string): Promise<ResultDto<null>> {
    const status = await this.urlsService.deleteUrl(keyword);
    return {
      success: status,
      message: status ? '删除成功' : '删除失败',
    };
  }

  @ApiCookieAuth()
  @UseGuards(CustomAuthGuard)
  @Get('admin/manage/getUrlList')
  async getUrlList(
    @Query() paginationQueryDto: PaginationQueryDto,
  ): Promise<ResultDto<PaginationDto<UrlModel>>> {
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
  async visitUrl(
    @Param('keyword') keyword: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const url = await this.urlsService.visitUrl(keyword, req);
    if (url) {
      res.redirect(302, url);
    } else {
      res.sendStatus(403);
    }
  }

  @Get()
  rootPage(@Res() res: Response) {
    res.sendStatus(403);
  }
}
