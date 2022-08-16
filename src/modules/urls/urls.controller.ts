import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Redirect,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UrlsService } from './urls.service';
import { Request } from 'express';
import { CreateDto } from './dto/create.dto';
import { ResultDto } from '../../core/result.dto';
import { AuthGuard } from '@nestjs/passport';

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
