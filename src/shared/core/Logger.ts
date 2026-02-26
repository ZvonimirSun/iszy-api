import * as process from 'node:process'
import { ConsoleLogger } from '@nestjs/common'
import { NestApplication } from '@nestjs/core'

export class Logger extends ConsoleLogger {
  constructor(context = NestApplication.name) {
    super(context)
    const isProduction = process.env.DEVELOPMENT !== 'true'
    this.setLogLevels(isProduction ? ['log', 'warn', 'error'] : ['error', 'warn', 'log', 'verbose', 'debug'])
  }
}
