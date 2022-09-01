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
import getLogLevels from './core/getLogLevels';
import info from '../package.json';
import session, { SessionOptions } from 'express-session';
import { createClient } from 'redis';
import connectRedis from 'connect-redis';
import { ConfigService } from '@nestjs/config';
import passport from 'passport';

const redisStore = connectRedis(session);
let configService: ConfigService;

// 设置passport序列化和反序列化user的方法，在将用户信息存储到session时使用
passport.serializeUser(function (user, done) {
  done(null, user);
});
// 反序列化
passport.deserializeUser(function (user, done) {
  done(null, user);
});

async function bootstrap() {
  dayjs.locale('zh-cn');
  dayjs.extend(utc);
  dayjs.extend(timezone);
  dayjs.extend(customParseFormat);
  dayjs.tz.setDefault('Asia/Shanghai');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: getLogLevels(process.env.DEVELOPMENT === 'true'),
  });

  configService = app.get(ConfigService);

  app.use(json({ limit: '200mb' }));
  app.use(urlencoded({ limit: '200mb', extended: true }));
  app.enableCors({
    origin: function (requestOrigin, callback) {
      const origins = configService.get<string[]>('app.allowOrigins');
      if (origins != null) {
        if (requestOrigin.includes(requestOrigin)) {
          callback(null, requestOrigin);
        } else {
          callback(new Error(`Not allow origin ${requestOrigin}`));
        }
      } else {
        callback(null, requestOrigin);
      }
    },
    credentials: true,
  });
  app.useGlobalFilters(new HttpExceptionFilter());

  if (configService.get<boolean>('behindProxy')) {
    app.set('trust proxy', 1);
  }

  const redisUrl =
    'redis://' +
    (configService.get<string>('redis.password')
      ? `:${encodeURIComponent(configService.get<string>('redis.password'))}@`
      : '') +
    `${configService.get<number>('redis.host')}:${configService.get<string>(
      'redis.port',
    )}`;

  const redisClient = createClient({
    url: redisUrl,
    legacyMode: true,
  });

  await redisClient.connect();

  const sessionConfig: SessionOptions = {
    secret: configService.get<string>('session.secret'),
    resave: false,
    saveUninitialized: false,
    // 使用redis存储session
    store: new redisStore({
      client: redisClient,
    }),
  };

  if (!configService.get<boolean>('development')) {
    sessionConfig.cookie = {
      sameSite: 'none',
      secure: true,
    };
  }

  app.use(session(sessionConfig));
  // 设置passport，并启用session
  app.use(passport.initialize());
  app.use(passport.session());

  const documentConfig = new DocumentBuilder()
    .addCookieAuth()
    .setTitle(configService.get<string>('app.title'))
    .setDescription(configService.get<string>('app.description'))
    .setVersion(info.version)
    .build();

  if (configService.get<boolean>('development')) {
    const document = SwaggerModule.createDocument(app, documentConfig);
    SwaggerModule.setup('api', app, document, {
      swaggerOptions: {
        requestInterceptor: (req) => {
          req.credentials = 'include';
          return req;
        },
      },
    });
  }

  await app.listen(configService.get<number>('app.port'));
}
bootstrap().then(() =>
  console.log(
    `Server is running on port ${configService.get<number>('app.port')}`,
  ),
);
