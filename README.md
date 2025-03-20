# ISZY API

[![build](https://github.com/ZvonimirSun/iszy-api/actions/workflows/docker.yml/badge.svg)](https://github.com/ZvonimirSun/iszy-api/actions/workflows/docker.yml)

[![Nest 10.x](https://img.shields.io/badge/Nest-10.x-blue)](https://nestjs.com/) [![code style](https://antfu.me/badge-code-style.svg)](https://github.com/antfu/eslint-config)

ISZY API集合，基于 [NestJS](http://nestjs.com/) 开发，主要为 [ISZY 工具集合](https://github.com/zvonimirsun/iszy-tools) 提供后端支持。

- 项目框架: [NestJS 11](http://nestjs.com/)
- 数据库ORM: [Sequelize 6](https://sequelize.org/)
- 数据库存储: [PostgreSQL 14](https://www.postgresql.org/)
- 文档生成: [OpenAPI 3](https://swagger.io/specification/)

## 项目安装

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm run start:debug
```

### 为生产环境构建产物

```bash
pnpm run build
```

### 本地预览生产构建产物

```bash
pnpm run start:prod
```

## License

[GNU version 3.0 licensed](LICENSE).
