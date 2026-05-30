import type {
  ArgumentsHost,
  ExceptionFilter,
} from '@nestjs/common'
import type { ResultDto } from '@zvonimirsun/iszy-common'
import type { Request, Response } from 'express'
import {
  Catch,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { Logger } from './Logger'

type ExceptionResponse = Record<string, unknown>

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const request = ctx.getRequest<Request>()
    const response = ctx.getResponse<Response>()
    const status
      = exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR
    const exceptionResponse = this.getExceptionResponse(exception)
    const message = this.getMessage(exception, status, exceptionResponse)

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception, '请求处理发生未捕获异常', {
        method: request.method,
        path: request.path,
        status,
      })
    }
    else if (Logger.isDebug()) {
      this.logger.debug('请求被拒绝', {
        method: request.method,
        path: request.path,
        status,
        message,
      })
    }

    const errorResponse: ResultDto<unknown> = {
      message,
      success: false, // 自定义code
    }
    // 透传业务异常中的补充信息，保持 ResultDto 只使用 success/message/data 统一结构。
    if (exceptionResponse && 'data' in exceptionResponse)
      errorResponse.data = exceptionResponse.data

    // 设置返回的状态码、请求头、发送错误信息
    response.status(status).json(errorResponse)
  }

  private getExceptionResponse(exception: unknown): ExceptionResponse | undefined {
    if (!(exception instanceof HttpException))
      return

    const exceptionResponse = exception.getResponse()
    if (exceptionResponse && typeof exceptionResponse === 'object')
      return exceptionResponse as ExceptionResponse
  }

  private getMessage(exception: unknown, status: number, exceptionResponse?: ExceptionResponse) {
    if (exception instanceof HttpException) {
      const rawResponse = exception.getResponse()
      if (typeof rawResponse === 'string')
        return rawResponse
      if (exceptionResponse && 'message' in exceptionResponse) {
        const message = (exceptionResponse as { message?: string | string[] }).message
        return Array.isArray(message) ? message.join('; ') : message || exception.message
      }
      return exception.message
    }
    if (exception instanceof Error)
      return exception.message || 'Service Error'
    return `${status >= 500 ? 'Service Error' : 'Client Error'}`
  }
}
