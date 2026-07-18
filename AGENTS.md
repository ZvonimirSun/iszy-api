# Agents

本文档用于帮助协作 Agent（或新加入开发者）快速理解 **iszy-api** 项目结构、核心模块与常用操作。

## 1. 项目概览

- 项目名：`iszy-api`
- 技术栈：NestJS 11 + Sequelize 6 + PostgreSQL 14
- 语言：TypeScript
- 包管理器：pnpm (`pnpm@11.5.0`)
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
    federated-auth/        # GitHub/LinuxDo OAuth、SSO 与票据换 Token
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

## 3. 关键文件索引

### 启动与装配

- `src/main.ts`：应用启动、Swagger、全局前缀、CORS、代理信任等入口配置。
- `src/app.module.ts`：根模块，装配 `SharedModule`、`InfrastructureModule`、`DomainsModule`。
- `src/domains/domains.ts`：业务模块注册清单，新增业务域通常从这里接入。
- `src/shared/shared.module.ts`：全局 Guard/Pipe/Filter/JWT 策略注册。

### 认证与账号

- `src/domains/auth/auth.controller.ts`：本地登录、登出、注册、刷新 token、设备接口。
- `src/domains/auth/auth.service.ts`：认证主流程、token 签发与设备绑定。
- `src/domains/auth/strategy/local.strategy.ts`：本地账号密码校验与登录防爆破入口。
- `src/domains/auth/store/device-store.ts`：设备、refresh token 与 Redis 绑定。
- `src/domains/auth/store/login-attempt-store.ts`：登录失败计数与临时封禁。
- `src/domains/federated-auth/oauth/`：GitHub/LinuxDo OAuth 控制器、策略、服务。
- `src/domains/federated-auth/sso/`：SSO 登录、账户完成、绑定与短期凭证流程。
- `src/domains/federated-auth/store/`：OAuth state、SSO completion 等 Redis 存储。
- `src/shared/core/decorator.ts`：`@Public()`、`@Private()`、`@RefreshToken()`、`@TicketOnly()` 等装饰器。
- `src/shared/core/jwt-auth.guard.ts`：全局 JWT 守卫。
- `src/shared/core/jwt.strategy.ts`：JWT 校验与请求用户注入。

### 用户与 RBAC

- `src/domains/user/user.controller.ts`、`me.controller.ts`：用户与我的信息接口。
- `src/domains/user/role.controller.ts`：角色管理。
- `src/domains/user/privilege.controller.ts`：权限管理。
- `src/domains/user/group.controller.ts`：分组管理。
- `src/domains/user/user.service.ts`：用户/RBAC 主要业务逻辑。
- `src/domains/user/entities/`：User、Role、Privilege、Group 及关联表模型。
- `src/domains/user/dto/rbac.dto.ts`：RBAC 相关 DTO。

### 工具后端能力

- `src/domains/iszy_tools/`：工具配置、权限相关能力。
- `src/domains/urls/`：短链管理和公共跳转。
- `src/domains/mocks/`：Mock 项目、接口数据和动态 mock 返回。
- `src/domains/holiday/`：节假日导入、查询、ICS 导出。
- `src/domains/gis/`：坐标点和几何转换。
- `src/domains/ddns/`：动态域名更新。
- `src/domains/rtc/`：RTC 信令相关能力。
- `src/domains/idiom/`、`src/domains/jsonEditor/`：成语与 JSON 编辑器数据能力。

### 基础设施与配置

- `src/infrastructure/config/default.ts`：配置默认值，只能写非敏感默认值。
- `src/infrastructure/config/configLoader.ts`：配置加载和环境变量覆盖逻辑。
- `src/infrastructure/config/config-load.module.ts`：配置模块装配。
- `src/infrastructure/cache/redis.module.ts`：Redis 缓存模块。
- `src/infrastructure/database/database.module.ts`：数据库连接和 Sequelize 配置。
- `src/shared/app-config.service.ts`：应用配置读取与启动辅助。

## 4. 模块装配关系

- `AppModule`
  - `SharedModule`（全局）
  - `InfrastructureModule`
  - `DomainsModule`

- `DomainsModule` 通过 `domains.ts` 统一注册：
  - `AuthModule`, `FederatedAuthModule`, `UserModule`
  - `DDNSModule`, `GisModule`, `HolidayModule`
  - `IdiomModule`, `IszyToolsModule`, `JsoneditorModule`
  - `MockModule`, `RtcModule`, `UrlsModule`

- `PublicDomains`（见 `domains.ts`）用于标识公开能力模块（如 Auth/FederatedAuth/DDNS/GIS/Holiday/Mock/Urls）。

## 5. 鉴权与全局策略

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

## 6. 主要业务域速查

### 6.1 Auth（`/auth`）
- `POST /auth/login`：本地账号登录（`LocalAuthGuard`）
- `POST /auth/logout`：登出（支持按设备）
- `POST /auth/refresh`：刷新 token
- `POST /auth/register`：注册
- `GET /auth/devices`：设备列表

### 6.2 Federated Auth（`/oauth`、`/sso`）
- Provider 回调：
  - `/oauth/github`
  - `/oauth/linuxdo`
- 通用：
  - `POST /oauth/code`
  - `POST /oauth/token`（TicketOnly）
  - `POST /oauth/unbind`
- SSO：
  - SSO 入口、回调、绑定与账户完成流程位于 `src/domains/federated-auth/sso/`。
  - 短期凭证只应保存在服务端 Redis，不要回传 provider token 或后端 token 给浏览器。

### 6.3 User（`/user`）
- 我的信息：`/user/me`
- 用户/角色/权限/分组控制器齐全：
  - `user.controller.ts`
  - `role.controller.ts`
  - `privilege.controller.ts`
  - `group.controller.ts`

### 6.4 Urls（`/urls`）
- 管理端 CRUD：`/urls/admin/...`
- 公共跳转：`GET /urls/:keyword`

### 6.5 Mock（`/mock`）
- Mock 项目与数据管理：`/mock/api/...`
- 对外 mock 命中：`ALL /mock/:mockPrjId/:prjPath/*dataPath`

### 6.6 Holiday（`/tools/holiday`）
- 导入节假日（受限）
- 查询当天/指定日期
- ICS 导出：`/tools/holiday/holiday.ics`

### 6.7 GIS（`/gis`）
- `POST /gis/transform-point`
- `POST /gis/transform-geometry`

### 6.8 DDNS（`/ddns`）
- `GET /ddns/:type/update`

## 7. 数据层与实体

项目采用 `@nestjs/sequelize` + `sequelize-typescript`。

典型模块在 `*.module.ts` 中通过 `SequelizeModule.forFeature([...])` 注入实体。
例如：
- User 域：`User/Role/Privilege/Group` 及关联中间表
- Urls 域：`UrlModel/OptionsModel/LogModel`
- Mock/Holiday/Idiom/JsonEditor 等域均有独立实体模型

## 8. 配置、缓存与敏感信息

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

安全约定：
- AGENTS/README/示例配置只能写变量名、用途、默认空值或占位符，不要写线上实际 API 地址、数据库地址、Redis 地址、OAuth client secret、JWT secret、对象存储密钥等本地不提交配置值。
- 可以说明 `apiOrigin`、Redis、数据库、OAuth、JWT 等配置项的语义，但真实值只应保存在 `.env.local`、部署平台变量或私有配置中。
- 排查问题时如需引用配置，使用脱敏形式，例如 `<API_ORIGIN>`、`<REDIS_HOST>`、`<SECRET>`。

Redis 缓存入口：`src/infrastructure/cache/redis.module.ts`。当前主要用于：
- 登录设备与 refresh token 绑定：`DeviceStore`
- 本地登录失败计数/临时封禁：`LoginAttemptStore`

修改鉴权、登录、设备、限流、防爆破相关逻辑时，要同时考虑 Redis key 设计、TTL、代理 IP 识别与前端依赖的错误码。

## 9. 开发命令（pnpm）

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

## 10. 代码风格、提交与工程约定

- ESLint 配置：`eslint.config.mjs`（基于 `@antfu/eslint-config`）
- TS 路径别名（`tsconfig.json`）：
  - `~/* -> src/*`
  - `~domains/* -> src/domains/*`
  - `~shared -> src/shared`
- 构建配置：`tsconfig.build.json`（排除 test/dist/spec）

Commit 规范：
- 使用常见前缀：`feat`、`fix`、`chore`、`docs`、`refactor`、`test`、`perf`、`style`、`build`、`ci`。
- 格式建议：`<type>: <中文提交内容>`，例如 `feat: 增加 SSO 账户完成接口`、`fix: 修复登录封禁计数过期时间`、`chore: 更新依赖版本`。
- 提交内容使用中文描述本次变更，不要只写英文或含糊的 `update`、`misc`。
- 涉及多个子项目时，优先按仓库分别提交；不要把无关格式化、lockfile 变化和业务改动混在一个 commit。

## 11. Agent 协作建议

1. **先看装配再改业务**：先读 `app.module.ts`、`domains.ts`、对应域 `*.module.ts`。
2. **默认接口受保护**：新增公开接口请显式加 `@Public()` 并审查风险。
3. **优先复用 shared 能力**：日志、DTO、鉴权装饰器、异常处理尽量沿用现有实现。
4. **对外错误码谨慎调整**：认证相关 `data.code` 已被前端消费，改名前先确认兼容策略。
5. **改实体同步看服务层**：模型字段变更会影响 service/controller/DTO。
6. **新增域模块时**：
   - 创建 `module/controller/service/dto/entities`
   - 加入 `domains.ts` 的 `Domains`（必要时也加入 `PublicDomains`）
7. **尊重现有工作区**：先看 `git status`，不要回滚他人或用户未提交的改动。

## 12. 快速排错清单

- 启动失败：先检查 `ConfigLoadModule` 与环境变量。
- 鉴权异常：确认是否遗漏 `@Public()` 或 token 类型不匹配（refresh/ticket）。
- 登录封禁异常：检查 `auth.fail2ban` 配置、Redis 连接、`LoginAttemptStore` key 与 `trust proxy`。
- ORM 报错：检查实体是否注册到对应 `SequelizeModule.forFeature`。
- 路由冲突：检查 controller 前缀与动态路由顺序（尤其是 `:param` 类路径）。
