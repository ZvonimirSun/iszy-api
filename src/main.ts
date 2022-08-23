import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { HttpExceptionFilter } from './core/filter/http-exception.filter';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'body-parser';
import { join } from 'path';
import * as nunjucks from 'nunjucks';

async function bootstrap() {
  dayjs.locale('zh-cn');
  dayjs.extend(utc);
  dayjs.extend(timezone);
  dayjs.extend(customParseFormat);
  dayjs.tz.setDefault('Asia/Shanghai');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger:
      process.env.DEVELOPMENT === 'true'
        ? ['log', 'error', 'warn', 'debug']
        : ['log', 'error', 'warn'],
  });
  const express = app.getHttpAdapter().getInstance();

  app.use(json({ limit: '200mb' }));
  app.use(urlencoded({ limit: '200mb', extended: true }));
  app.enableCors();
  app.useGlobalFilters(new HttpExceptionFilter());

  const assets = join(__dirname, '..', 'assets');
  const views = join(__dirname, '..', 'views');
  const environment = nunjucks.configure(views, { express });

  app.useStaticAssets(assets);
  app.engine('njk', environment.render);
  app.setBaseViewsDir(views);
  app.setViewEngine('njk');
  app.set('view cache', true);

  const config = new DocumentBuilder()
    .addBearerAuth()
    .setTitle(process.env.APP_TITLE || 'ISZY API')
    .setDescription(process.env.APP_DESCRIPTION || 'ISZY API description')
    .setVersion('1.0')
    .build();

  if (process.env.DEVELOPMENT === 'true') {
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  await app.listen(process.env.PORT || 3000);
}
bootstrap().then(() =>
  console.log(`Server is running on port ${process.env.PORT || 3000}`),
);
