import type {
  ArgumentsHost,
  ExceptionFilter,
} from '@nestjs/common'
import type { Response } from 'express'
import type { ResultDto } from '../dto/result.dto'
import {
  Catch,
  HttpException,
  HttpStatus,
} from '@nestjs/common'

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const status
      = exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR
    const message = exception.message
      ? exception.message
      : `${status >= 500 ? 'Service Error' : 'Client Error'}`
    const errorResponse: ResultDto<void> = {
      message,
      success: false, // 自定义code
    }
    // 设置返回的状态码、请求头、发送错误信息
    response.status(status).json(errorResponse)
  }
}
