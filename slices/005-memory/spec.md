# 切片: 长期记忆

## 编号
slice-005

## 前置依赖
- slice-004（流式聊天，对话上下文 + prompt 组装）

## 目标
实现 pgvector 向量记忆：用户对话中提及的关键信息 -> 提取存储为向量 -> 后续对话检索 top-5 注入 system prompt -> 角色能记住用户的事。向量库失败降级不阻断。

## 涉及文件（本切片独占）

### server/
- `server/app/models/memory.py` - Memory ORM（id / user_id / conversation_id / content / embedding(vector) / metadata(jsonb) / created_at）
- `server/app/schemas/memory.py` - Pydantic
- `server/app/api/memory.py` - 记忆查看/删除路由
- `server/app/services/memory/extract.py` - 记忆提取（LLM 抽取关键信息）★Protected
- `server/app/services/memory/retrieve.py` - 向量检索 top-k ★Protected
- `server/app/services/memory/inject.py` - 记忆注入 system prompt ★Protected
- `server/alembic/versions/xxx_add_memory.py` - Memory 表 + pgvector 扩展迁移

### web/
- `web/app/(app)/settings/memory/page.tsx` - 记忆管理页（列表/删除）
- `web/features/memory/memory-list.tsx` - 记忆列表组件
- `web/lib/store.ts` - 记忆相关 state（追加）

## 共享文件（追加式修改）
- `server/app/main.py` - 挂载 memory router
- `server/app/services/chat/prompt.py` - 注入记忆到 system prompt（检索 top-5 拼入）
- `server/app/api/chat.py` - 对话完成后异步提取记忆
- `server/app/core/database.py` - 切换 SQLite -> Postgres + pgvector
- `web/app/(app)/settings/page.tsx` - 添加"记忆管理"入口

## 验收标准
- [ ] 用户提及关键信息（姓名/喜好/事件）-> 提取存储为向量记忆
- [ ] 后续对话检索 top-5 相关记忆注入 system prompt
- [ ] 角色能复述/引用用户之前提及的事
- [ ] 角色能复述 3 天前用户提及的事
- [ ] 向量库查询失败 -> 降级无记忆对话，不阻断
- [ ] 记忆去重（相似度阈值过滤）
- [ ] 用户可在设置页查看记忆列表
- [ ] 用户可删除单条记忆
- [ ] 记忆提取不阻塞对话主流程（异步）

## 测试 anchor
- 单元测试：`server/tests/unit/test_memory_extract.py`（关键信息提取）
- 单元测试：`server/tests/unit/test_memory_retrieve.py`（向量检索 + 去重）
- 集成测试：`server/tests/integration/test_memory_flow.py`（提取->存储->检索->注入）
- E2E：`web/e2e/memory.spec.ts`（对话提及信息 -> 设置页查看记忆 -> 删除）

## Protected Region
- `server/app/services/memory/extract.py` - 记忆提取逻辑（LLM prompt 设计）
- `server/app/services/memory/retrieve.py` - 向量检索逻辑（top-k + 去重）
- `server/app/services/memory/inject.py` - 记忆注入逻辑（prompt 拼装）

## 备注
- Memory 表：id / user_id / conversation_id / content / embedding(vector(1536)) / metadata(jsonb) / created_at
- **需先安装 Postgres + pgvector 扩展**（开发环境从 SQLite 切换）
- embedding 维度取决于 provider：OpenAI text-embedding-3-small=1536，DeepSeek 无 embedding 需用其他 provider
- 记忆提取 prompt：从用户消息中抽取"用户姓名/喜好/重要事件/关系"等关键信息
- 检索：用当前对话最新消息 embedding 查 top-5，相似度 >0.7 过滤
- 注入：在 system prompt 中追加"[用户记忆] xxx"段
- 去重：新记忆与已有记忆相似度 >0.9 时更新而非新增
- 异步提取：对话回复完成后，后台任务提取记忆，不阻塞 SSE 响应
- 本切片不含：日记记忆提取（008）、情绪触发（009）
