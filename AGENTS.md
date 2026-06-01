# Agents

本文档用于帮助协作 Agent（或新加入开发者）快速理解 **iszy-api** 项目结构、核心模块与常用操作。

## 1. 项目概览

- 项目名：`iszy-api`
- 技术栈：NestJS 11 + Sequelize 6 + PostgreSQL 14
- 语言：TypeScript
- 包管理器：pnpm (`pnpm@11.2.2`)
- API 文档：Swagger / OpenAPI 3
- 代码入口：`src/main.ts`

核心定位：为 ISZY 工具集合提供统一后端能力（认证、用户体系、短链、Mock、节假日、GIS、DDNS 等）。

## 2. 目录索引（高价值）

```text
src/
  main.ts                  # 应用启动入口
  app.module.ts            # 根模块（装配 Shared/Infrastructure/Domains）
  app.controller.ts        # 根控制器

  domains/                 # 业务域模块（核心）
    domains.module.ts
    domains.ts             # 业务模块注册清单（含 PublicDomains）

    auth/                  # 登录/注册/JWT 刷新/设备管理
    oauth/                 # GitHub/LinuxDo OAuth 与票据换 Token
    user/                  # 用户、角色、权限、分组、我的信息
    urls/                  # 短链管理与访问跳转
    mocks/                 # Mock 项目与接口数据管理、动态 mock 返回
    holiday/               # 节假日导入、查询、ICS 导出
    gis/                   # 坐标/几何转换
    ddns/                  # 动态域名更新
    idiom/                 # 成语相关能力
    iszy_tools/            # 工具配置相关能力
    jsonEditor/            # JSON 编辑器数据能力

  infrastructure/          # 基础设施层
    infrastructure.module.ts
    config/                # 配置加载
    cache/redis.module.ts  # 缓存（Redis）
    database/              # 数据库连接与模型注册

  shared/                  # 全局共享层
    shared.module.ts       # 全局 Guard/Pipe/Filter 注册
    app-config.service.ts  # 应用配置与启动流程
    enums/dtos/types       # 通用类型与 DTO
```

## 3. 模块装配关系

- `AppModule`
  - `SharedModule`（全局）
  - `InfrastructureModule`
  - `DomainsModule`

- `DomainsModule` 通过 `domains.ts` 统一注册：
  - `AuthModule`, `OauthModule`, `UserModule`
  - `DDNSModule`, `GisModule`, `HolidayModule`
  - `IdiomModule`, `IszyToolsModule`, `JsoneditorModule`
  - `MockModule`, `UrlsModule`

- `PublicDomains`（见 `domains.ts`）用于标识公开能力模块（如 DDNS/GIS/Holiday/Mock/Urls/Auth）。

## 4. 鉴权与全局策略

`src/shared/shared.module.ts` 注册了全局能力：

- 全局异常过滤器：`HttpExceptionFilter`
- 全局参数校验：`AppValidationPipe`
- 全局鉴权守卫：`JwtAuthGuard`
- JWT 策略：`JwtStrategy`

因此：
- 默认接口受 JWT 保护；
- 显式公开接口使用 `@Public()`；
- 特殊权限场景可见如 `@Private()`、`@RefreshToken()`、`@TicketOnly()`。

本地账号登录还有一层防爆破逻辑：
- 入口：`src/domains/auth/strategy/local.strategy.ts`
- 计数/封禁：`src/domains/auth/store/login-attempt-store.ts`
- 当前按 **账号维度** 和 **IP 维度** 同时计数，避免 IP 池爆破单账号、单 IP 撞库多账号。
- 对外封禁响应统一使用 `data.code = "LOGIN_BANNED"`，前端依赖该关键字；不要随意改名或泄露触发维度。
- `req.ip` 依赖 Express 的 `trust proxy` 配置；部署在 Nginx/CDN/网关后面时需同步检查 `behindProxy` / `trustProxy`。

## 5. 主要业务域速查

### 5.1 Auth（`/auth`）
- `POST /auth/login`：本地账号登录（`LocalAuthGuard`）
- `POST /auth/logout`：登出（支持按设备）
- `POST /auth/refresh`：刷新 token
- `POST /auth/register`：注册
- `GET /auth/devices`：设备列表

### 5.2 OAuth（`/oauth`）
- Provider 回调：
  - `/oauth/github`
  - `/oauth/linuxdo`
- 通用：
  - `POST /oauth/code`
  - `POST /oauth/token`（TicketOnly）
  - `POST /oauth/unbind`

### 5.3 User（`/user`）
- 我的信息：`/user/me`
- 用户/角色/权限/分组控制器齐全：
  - `user.controller.ts`
  - `role.controller.ts`
  - `privilege.controller.ts`
  - `group.controller.ts`

### 5.4 Urls（`/urls`）
- 管理端 CRUD：`/urls/admin/...`
- 公共跳转：`GET /urls/:keyword`

### 5.5 Mock（`/mock`）
- Mock 项目与数据管理：`/mock/api/...`
- 对外 mock 命中：`ALL /mock/:mockPrjId/:prjPath/*dataPath`

### 5.6 Holiday（`/tools/holiday`）
- 导入节假日（受限）
- 查询当天/指定日期
- ICS 导出：`/tools/holiday/holiday.ics`

### 5.7 GIS（`/gis`）
- `POST /gis/transform-point`
- `POST /gis/transform-geometry`

### 5.8 DDNS（`/ddns`）
- `GET /ddns/:type/update`

## 6. 数据层与实体

项目采用 `@nestjs/sequelize` + `sequelize-typescript`。

典型模块在 `*.module.ts` 中通过 `SequelizeModule.forFeature([...])` 注入实体。
例如：
- User 域：`User/Role/Privilege/Group` 及关联中间表
- Urls 域：`UrlModel/OptionsModel/LogModel`
- Mock/Holiday/Idiom/JsonEditor 等域均有独立实体模型

## 7. 配置与缓存

配置入口：
- 默认值：`src/infrastructure/config/default.ts`
- 加载器：`src/infrastructure/config/configLoader.ts`
- Nest 模块：`src/infrastructure/config/config-load.module.ts`

配置优先级从高到低：
1. `process.env`
2. `.env.local`
3. `.env`
4. `config/config.yaml`
5. `DefaultConfig`

环境变量通过 `I_` 前缀覆盖配置项，并支持 `{{ENV_NAME}}` 形式的环境变量展开。

Redis 缓存入口：`src/infrastructure/cache/redis.module.ts`。当前主要用于：
- 登录设备与 refresh token 绑定：`DeviceStore`
- 本地登录失败计数/临时封禁：`LoginAttemptStore`

修改鉴权、登录、设备、限流、防爆破相关逻辑时，要同时考虑 Redis key 设计、TTL、代理 IP 识别与前端依赖的错误码。

## 8. 开发命令（pnpm）

```bash
pnpm install          # 安装依赖
pnpm run start:debug  # 本地调试开发
pnpm run start:dev    # watch 模式
pnpm run build        # 构建 dist
pnpm run start:prod   # 运行生产构建
pnpm run lint         # ESLint 自动修复
```

建议：
- 普通代码改动后至少跑 `pnpm run build`。
- `pnpm run lint` 会自动修复，可能改动较多；执行前先确认当前工作区变更范围。

## 9. 代码风格与工程约定

- ESLint 配置：`eslint.config.mjs`（基于 `@antfu/eslint-config`）
- TS 路径别名（`tsconfig.json`）：
  - `~/* -> src/*`
  - `~domains/* -> src/domains/*`
  - `~shared -> src/shared`
- 构建配置：`tsconfig.build.json`（排除 test/dist/spec）

## 10. Agent 协作建议

1. **先看装配再改业务**：先读 `app.module.ts`、`domains.ts`、对应域 `*.module.ts`。
2. **默认接口受保护**：新增公开接口请显式加 `@Public()` 并审查风险。
3. **优先复用 shared 能力**：日志、DTO、鉴权装饰器、异常处理尽量沿用现有实现。
4. **对外错误码谨慎调整**：认证相关 `data.code` 已被前端消费，改名前先确认兼容策略。
5. **改实体同步看服务层**：模型字段变更会影响 service/controller/DTO。
6. **新增域模块时**：
   - 创建 `module/controller/service/dto/entities`
   - 加入 `domains.ts` 的 `Domains`（必要时也加入 `PublicDomains`）
7. **尊重现有工作区**：先看 `git status`，不要回滚他人或用户未提交的改动。

## 11. 快速排错清单

- 启动失败：先检查 `ConfigLoadModule` 与环境变量。
- 鉴权异常：确认是否遗漏 `@Public()` 或 token 类型不匹配（refresh/ticket）。
- 登录封禁异常：检查 `auth.fail2ban` 配置、Redis 连接、`LoginAttemptStore` key 与 `trust proxy`。
- ORM 报错：检查实体是否注册到对应 `SequelizeModule.forFeature`。
- 路由冲突：检查 controller 前缀与动态路由顺序（尤其是 `:param` 类路径）。

---

如需进一步细化，可继续补充：
- 环境变量清单（按模块）
- 关键数据库表关系图
- 各域 OpenAPI 示例请求/响应
