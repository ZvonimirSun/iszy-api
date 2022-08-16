import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { HttpExceptionFilter } from './core/filter/http-exception.filter';
import { json, urlencoded } from 'body-parser';

async function bootstrap() {
  dayjs.locale('zh-cn');
  dayjs.extend(utc);
  dayjs.extend(timezone);
  dayjs.extend(customParseFormat);
  dayjs.tz.setDefault('Asia/Shanghai');

  const app = await NestFactory.create(AppModule);
  app.use(json({ limit: '200mb' }));
  app.use(urlencoded({ limit: '200mb', extended: true }));
  app.enableCors();
  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .addBearerAuth()
    .setTitle(process.env.APP_TITLE || 'ISZY API')
    .setDescription(process.env.APP_DESCRIPTION || 'ISZY API description')
    .setVersion('1.0')
    .build();

  if (process.env.ENABLE_SWAGGER === 'true') {
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
