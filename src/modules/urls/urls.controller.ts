import { ApiTags } from '@nestjs/swagger';
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
import { Response } from 'express';
import { CreateDto } from './dto/create.dto';
import { ResultDto } from '../../core/dto/result.dto';
import { PaginationQueryDto } from './dto/pagination_query.dto';
import { UpdateDto } from './dto/update.dto';
import { UrlModel } from './entities/url.model';
import { PaginationDto } from '../../core/dto/pagination.dto';
import { CustomAuthGuard } from '../auth/guard/custom-auth.guard';
import { AuthRequest } from '../../core/types/AuthRequest';

@ApiTags('Urls')
@Controller('urls')
export class UrlsController {
  constructor(private readonly urlsService: UrlsService) {}

  @UseGuards(CustomAuthGuard)
  @Post('admin/url')
  async createUrl(
    @Body() createDto: CreateDto,
    @Req() req: AuthRequest,
  ): Promise<ResultDto<null>> {
    try {
      await this.urlsService.createUrl(
        req.user.userId,
        req.ip,
        createDto.url,
        createDto.keyword,
      );
      return {
        success: true,
        message: '创建成功',
      };
    } catch (e) {
      return {
        success: false,
        message: '创建失败，' + e.message,
      };
    }
  }

  @UseGuards(CustomAuthGuard)
  @Get('admin/url/:keyword')
  async readUrl(
    @Param('keyword') keyword: string,
    @Req() req: AuthRequest,
  ): Promise<ResultDto<UrlModel>> {
    const data = await this.urlsService.readUrl(req.user.userId, keyword);
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

  @UseGuards(CustomAuthGuard)
  @Put('admin/url/:keyword')
  async updateUrl(
    @Param('keyword') keyword: string,
    @Req() req: AuthRequest,
    @Body() updateDto: UpdateDto,
  ): Promise<ResultDto<null>> {
    try {
      await this.urlsService.updateUrl(req.user.userId, keyword, updateDto.url);
      return {
        success: true,
        message: '更新成功',
      };
    } catch (e) {
      return {
        success: false,
        message: '更新失败，' + e.message,
      };
    }
  }

  @UseGuards(CustomAuthGuard)
  @Delete('admin/url/:keyword')
  async deleteUrl(
    @Param('keyword') keyword: string,
    @Req() req: AuthRequest,
  ): Promise<ResultDto<null>> {
    try {
      await this.urlsService.deleteUrl(req.user.userId, keyword);
      return {
        success: true,
        message: '删除成功',
      };
    } catch (e) {
      return {
        success: false,
        message: '删除失败，' + e.message,
      };
    }
  }

  @UseGuards(CustomAuthGuard)
  @Get('admin/urls')
  async getUrlList(
    @Query() paginationQueryDto: PaginationQueryDto,
    @Req() req: AuthRequest,
  ): Promise<ResultDto<PaginationDto<UrlModel>>> {
    const data = await this.urlsService.getUrlList(
      req.user.userId,
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
    @Req() req: AuthRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (keyword.endsWith('+')) {
      if (!req.user) {
        res.status(403);
        return;
      }
      keyword = keyword.slice(0, -1);
      return await this.urlsService.staticUrl(req.user.userId, keyword);
    } else {
      const url = await this.urlsService.visitUrl(keyword, req);
      if (url) {
        res.redirect(302, url);
        return;
      } else {
        res.status(403);
        return;
      }
    }
  }

  @Get()
  rootPage(@Res({ passthrough: true }) res: Response) {
    res.status(403);
  }
}
