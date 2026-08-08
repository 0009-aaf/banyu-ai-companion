# 切片: 项目脚手架 + 数据库 + 鉴权

## 编号
slice-001

## 前置依赖
- 无（所有切片的基础）

## 目标
搭建 web/（Next.js）+ server/（FastAPI）项目骨架，初始化 Postgres + pgvector，实现用户注册/登录（JWT + httpOnly Cookie）。

## 涉及文件（本切片独占）

### server/（FastAPI）
- `server/app/main.py` - FastAPI 入口，挂载路由 + CORS
- `server/app/core/config.py` - 配置（env：DB_URL / JWT_SECRET / CORS_ORIGINS）
- `server/app/core/database.py` - SQLAlchemy async engine + session
- `server/app/core/security.py` - 密码哈希（bcrypt）+ JWT 签发/校验
- `server/app/core/deps.py` - 依赖注入（get_current_user）
- `server/app/models/user.py` - User ORM
- `server/app/schemas/user.py` - Pydantic（注册/登录/响应）
- `server/app/api/auth.py` - 注册/登录路由
- `server/alembic/` - 迁移初始化 + User 表 + pgvector 扩展
- `server/pyproject.toml` - 依赖（fastapi/uvicorn/sqlalchemy/asyncpg/alembic/pyjwt/bcrypt/pydantic-settings）
- `server/.env.example`

### web/（Next.js）
- `web/package.json` - Next 14 + TS + Tailwind + shadcn/ui + Zustand
- `web/app/layout.tsx` - 根布局
- `web/app/(auth)/login/page.tsx` - 登录页
- `web/app/(auth)/register/page.tsx` - 注册页
- `web/app/(app)/layout.tsx` - 受保护布局（底部 tab）
- `web/lib/api.ts` - API client（带 cookie）
- `web/lib/auth.ts` - 客户端鉴权状态（Zustand）
- `web/tailwind.config.ts` / `web/app/globals.css`

## 共享文件（追加式修改，不重写已有内容）
- `server/app/main.py` - 后续切片在此挂载路由（include_router）
- `web/app/(app)/layout.tsx` - 后续切片在此添加 tab 项

## 验收标准
- [ ] `cd server && uvicorn app.main:app` 启动，`/docs` 可见 OpenAPI
- [ ] `cd web && npm run dev` 启动，登录/注册页可访问
- [ ] 注册新账号 -> 自动登录 -> 跳转首页
- [ ] 注册重复邮箱 -> 提示"邮箱已注册"
- [ ] 密码 <8 位 -> 提示"密码至少 8 位"
- [ ] 登录错误 -> 提示"账号或密码错误"，不泄漏具体是账号还是密码错
- [ ] 登录后刷新页面仍保持登录态（httpOnly Cookie）
- [ ] 未登录访问 /(app)/* -> 重定向到 /login
- [ ] pgvector 扩展已在数据库启用（`CREATE EXTENSION vector`）

## 测试 anchor
- 单元测试：`server/tests/unit/test_security.py`（密码哈希/JWT）
- 集成测试：`server/tests/integration/test_auth.py`（注册/登录 API）
- E2E：`web/e2e/auth.spec.ts`（注册->登录->跳转）

## Protected Region（AI 不可覆盖）
- `server/app/core/security.py` - 密码哈希/JWT 逻辑（安全关键）
- `server/app/core/deps.py` - 鉴权依赖（安全关键）

## 备注
- User 表字段：id(uuid) / email / password_hash / nickname / created_at
- Cookie 配置：httpOnly + SameSite=Lax + Secure(生产)
- 后续所有切片的 API 都依赖 `get_current_user` 依赖
