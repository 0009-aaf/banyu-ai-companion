# 切片: 流式聊天

## 编号
slice-004

## 前置依赖
- slice-002（LLM 适配层，chat_stream）
- slice-003（角色系统，角色人设注入）

## 目标
实现流式对话：用户发消息 -> 后端调 LLM chat_stream -> SSE 逐 token 推送前端 -> 打字效果渲染 -> 消息落库。角色人设注入 system prompt。

## 涉及文件（本切片独占）

### server/
- `server/app/models/conversation.py` - Conversation + Message ORM
- `server/app/schemas/chat.py` - Pydantic
- `server/app/api/chat.py` - 流式对话 SSE 路由 + 会话/消息查询
- `server/app/services/chat/prompt.py` - system prompt 组装（角色人设 + 上下文）★Protected
- `server/alembic/versions/xxx_add_conversation.py` - Conversation/Message 迁移

### web/
- `web/app/(app)/chat/[id]/page.tsx` - 对话页
- `web/features/chat/chat-view.tsx` - 消息流 + 输入栏
- `web/features/chat/message-bubble.tsx` - 消息气泡
- `web/features/chat/message-input.tsx` - 输入栏（文字）
- `web/features/chat/stream.ts` - SSE 流式处理 ★Protected
- `web/lib/store.ts` - 会话/消息 Zustand（追加）

## 共享文件（追加式修改）
- `server/app/main.py` - 挂载 chat router
- `web/app/(app)/layout.tsx` - 对话 tab 项 + 默认路由

## 验收标准
- [ ] 选择角色 -> 进入对话页 -> 发送消息 -> 角色 SSE 流式回复，打字效果渲染
- [ ] 首 token <1.5s，完整回复 <30s
- [ ] 消息持久化：刷新页面后历史消息仍在
- [ ] 空消息不发送
- [ ] 超长消息(>4000 字) -> 截断并提示
- [ ] LLM 调用失败 -> 显示"角色暂时走神了，稍后再试"，用户消息不丢失
- [ ] 角色人设一致：回复符合角色性格（system prompt 注入 persona）
- [ ] 未配置 LLM key -> 提示"请先在设置页配置 API key"
- [ ] 多会话：可创建新会话 / 切换历史会话

## 测试 anchor
- 单元测试：`server/tests/unit/test_prompt.py`（system prompt 组装）
- 集成测试：`server/tests/integration/test_chat.py`（SSE 流式 + 消息落库）
- E2E：`web/e2e/chat.spec.ts`（发消息 -> 收流式回复 -> 刷新看历史）

## Protected Region
- `web/features/chat/stream.ts` - 前端 SSE 流式处理
- `server/app/services/chat/prompt.py` - system prompt 组装（人设注入逻辑）

## 备注
- Conversation 表：id / user_id / character_id / title / created_at
- Message 表：id / conversation_id / role(user/assistant) / content / created_at
- system prompt = 角色人设(persona) + 对话指引（情绪支持调性）
- 上下文窗口：取最近 N 条消息（如 20 条）注入
- SSE 事件：`data: {"token": "..."}\n\n`，结束 `data: [DONE]\n\n`
- 本切片不含：记忆注入（005）、语音（P1）、情绪触发（006）
