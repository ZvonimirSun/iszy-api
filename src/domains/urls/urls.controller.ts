import type { ResultDto } from '@zvonimirsun/iszy-common'
import type { Request, Response } from 'express'
import type { PaginationDto } from '~core/dto/pagination.dto'
import type { AuthRequest } from '~types/AuthRequest'
import type { CreateDto } from './dto/create.dto'
import type { PaginationQueryDto } from './dto/pagination_query.dto'
import type { UpdateDto } from './dto/update.dto'
import type { UrlModel } from './entities/url.model'
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
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { Public } from '~core/decorator'
import { UrlsService } from './urls.service'

@ApiBearerAuth()
@ApiTags('Urls')
@Controller('urls')
export class UrlsController {
  constructor(private readonly urlsService: UrlsService) {}

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
      )
      return {
        success: true,
        message: '创建成功',
      }
    }
    catch (e) {
      return {
        success: false,
        message: `创建失败，${e.message}`,
      }
    }
  }

  @Get('admin/url/:keyword')
  async readUrl(
    @Param('keyword') keyword: string,
    @Req() req: AuthRequest,
  ): Promise<ResultDto<UrlModel>> {
    const data = await this.urlsService.readUrl(req.user.userId, keyword)
    if (data) {
      return {
        success: true,
        message: '获取成功',
        data,
      }
    }
    else {
      return {
        success: false,
        message: '获取失败',
      }
    }
  }

  @Put('admin/url/:keyword')
  async updateUrl(
    @Param('keyword') keyword: string,
    @Req() req: AuthRequest,
    @Body() updateDto: UpdateDto,
  ): Promise<ResultDto<null>> {
    try {
      await this.urlsService.updateUrl(req.user.userId, keyword, updateDto.url)
      return {
        success: true,
        message: '更新成功',
      }
    }
    catch (e) {
      return {
        success: false,
        message: `更新失败，${e.message}`,
      }
    }
  }

  @Delete('admin/url/:keyword')
  async deleteUrl(
    @Param('keyword') keyword: string,
    @Req() req: AuthRequest,
  ): Promise<ResultDto<null>> {
    try {
      await this.urlsService.deleteUrl(req.user.userId, keyword)
      return {
        success: true,
        message: '删除成功',
      }
    }
    catch (e) {
      return {
        success: false,
        message: `删除失败，${e.message}`,
      }
    }
  }

  @Get('admin/urls')
  async getUrlList(
    @Query() paginationQueryDto: PaginationQueryDto,
    @Req() req: AuthRequest,
  ): Promise<ResultDto<PaginationDto<UrlModel>>> {
    const data = await this.urlsService.getUrlList(
      req.user.userId,
      paginationQueryDto.pageIndex,
      paginationQueryDto.pageSize,
    )
    if (data) {
      return {
        success: true,
        message: '获取成功',
        data,
      }
    }
    else {
      return {
        success: false,
        message: '获取失败',
      }
    }
  }

  @Public()
  @Get(':keyword')
  async visitUrl(
    @Param('keyword') keyword: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const url = await this.urlsService.visitUrl(keyword, req)
    if (url)
      res.redirect(302, url)

    else
      res.status(403)
  }

  @Public()
  @Get()
  rootPage(@Res({ passthrough: true }) res: Response) {
    res.status(403)
  }
}
