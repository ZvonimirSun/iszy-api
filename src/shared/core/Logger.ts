import * as process from 'node:process'
import { ConsoleLogger, LogLevel } from '@nestjs/common'
import { NestApplication } from '@nestjs/core'

type LogMeta = Record<string, unknown>

export class Logger extends ConsoleLogger {
  constructor(context = NestApplication.name) {
    super(context)
    this.setLogLevels(Logger.getLogLevels())
  }

  static isDebug() {
    return ['1', 'true', 'debug', 'verbose'].includes(`${process.env.DEBUG ?? ''}`.toLowerCase())
      || process.env.DEVELOPMENT === 'true'
      || process.env.LOG_LEVEL === 'debug'
      || process.env.LOG_LEVEL === 'verbose'
  }

  static getLogLevels(): LogLevel[] {
    if (Logger.isDebug())
      return ['error', 'warn', 'log', 'verbose', 'debug']
    return ['error', 'warn', 'log']
  }

  audit(action: string, meta?: LogMeta) {
    this.log(this.formatLogMessage(action, meta))
  }

  debug(message: any, ...optionalParams: any[]) {
    const { meta, context } = this.parseParams(optionalParams)
    super.debug(this.formatLogMessage(message, meta), context)
  }

  verbose(message: any, ...optionalParams: any[]) {
    const { meta, context } = this.parseParams(optionalParams)
    super.verbose(this.formatLogMessage(message, meta), context)
  }

  warn(message: any, ...optionalParams: any[]) {
    const { meta, context } = this.parseParams(optionalParams)
    super.warn(this.formatLogMessage(message, meta), context)
  }

  error(error: unknown, messageOrMeta?: string | LogMeta, metaOrContext?: LogMeta | string) {
    const normalized = this.normalizeError(error)
    const message = typeof messageOrMeta === 'string'
      ? messageOrMeta
      : normalized.message
    const meta = typeof messageOrMeta === 'object'
      ? messageOrMeta
      : typeof metaOrContext === 'object'
        ? metaOrContext
        : undefined
    const context = typeof metaOrContext === 'string' ? metaOrContext : undefined

    super.error(this.formatLogMessage(message, {
      ...meta,
      error: normalized.message,
      name: normalized.name,
    }), normalized.stack, context)
  }

  private normalizeError(error: unknown) {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
      }
    }
    if (typeof error === 'string') {
      return {
        name: 'Error',
        message: error,
        stack: undefined,
      }
    }
    return {
      name: 'Error',
      message: this.stringify(error),
      stack: undefined,
    }
  }

  private parseParams(optionalParams: any[]) {
    const [first, second] = optionalParams
    return {
      meta: first && typeof first === 'object' && !Array.isArray(first) ? first as LogMeta : undefined,
      context: typeof first === 'string' ? first : typeof second === 'string' ? second : undefined,
    }
  }

  private formatLogMessage(message: any, meta?: LogMeta) {
    const text = typeof message === 'string' ? message : this.stringify(message)
    if (!meta || !Object.keys(meta).length)
      return text
    return `${text} ${this.stringify(this.redact(meta))}`
  }

  private stringify(value: unknown) {
    if (typeof value === 'string')
      return value
    try {
      return JSON.stringify(value)
    }
    catch {
      return String(value)
    }
  }

  private redact(meta: LogMeta): LogMeta {
    const result: LogMeta = {}
    for (const [key, value] of Object.entries(meta)) {
      if (/password|passwd|secret|token|authorization|credential/i.test(key)) {
        result[key] = '[REDACTED]'
      }
      else if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = this.redact(value as LogMeta)
      }
      else {
        result[key] = value
      }
    }
    return result
  }
}
