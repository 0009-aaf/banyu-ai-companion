# 切片: 主动陪伴

## 编号
slice-006

## 前置依赖
- slice-003（角色系统，角色人设生成主动消息）
- slice-004（流式聊天，对话页展示主动消息）

## 目标
实现主动式陪伴：APScheduler 定时触发（早安/晚安/随机问候）+ 事件触发（久未上线）-> 生成主动消息 -> Web Push 推送 + 应用内消息。用户点击推送打开对话页看到角色主动消息。推送失败降级应用内展示。

## 涉及文件（本切片独占）

### server/
- `server/app/models/push.py` - PushSubscription ORM（id / user_id / endpoint / p256dh / auth / created_at）
- `server/app/schemas/push.py` - Pydantic
- `server/app/api/push.py` - Web Push 订阅/取消路由
- `server/app/services/proactive/scheduler.py` - APScheduler 调度入口 ★Protected
- `server/app/services/proactive/generator.py` - 主动消息生成（LLM + 兜底文案）★Protected
- `server/app/services/proactive/push.py` - Web Push 推送（VAPID 签名）★Protected
- `server/app/scheduler/__init__.py` - APScheduler 生命周期管理（启动/关闭）

### web/
- `web/app/(app)/settings/notifications/page.tsx` - 通知开关设置页
- `web/features/push/push-subscribe.ts` - Web Push 订阅逻辑
- `web/public/sw.js` - Service Worker（接收 push 事件 + 点击跳转）
- `web/lib/store.ts` - 通知偏好 state（追加）

## 共享文件（追加式修改）
- `server/app/main.py` - 挂载 push router + lifespan 启动 scheduler
- `server/app/core/config.py` - VAPID public/private key 配置项
- `server/app/models/conversation.py` - Message.role 增加 proactive 类型（角色主动消息）
- `server/app/api/chat.py` - 查询会话消息时包含 proactive 消息
- `web/app/(app)/settings/page.tsx` - 添加"通知设置"入口
- `web/app/(app)/layout.tsx` - 底部 tab 红点提示（有新主动消息）

## 验收标准
- [ ] 定时任务触发 -> 生成主动消息 -> Web Push 推送 + 应用内消息
- [ ] 用户点击推送 -> 打开对话页 -> 看到角色主动消息
- [ ] 定时任务准时触发（误差 <1min）
- [ ] 推送服务不可达 -> 消息存应用内待用户上线展示
- [ ] LLM 生成失败 -> 使用预设兜底文案（早安/晚安/随机问候模板）
- [ ] 用户关闭通知 -> 仅应用内展示
- [ ] 夜间时段(23:00-7:00)不推送（除非用户开启夜间模式）
- [ ] 同日主动消息 <=3 条
- [ ] 主动消息符合角色人设（generator 注入 persona）
- [ ] 用户上线时展示离线期间的主动消息

## 测试 anchor
- 单元测试：`server/tests/unit/test_proactive_generator.py`（消息生成 + 兜底文案）
- 单元测试：`server/tests/unit/test_proactive_push.py`（VAPID 签名 + 推送）
- 集成测试：`server/tests/integration/test_scheduler.py`（定时触发 + 消息落库）
- E2E：`web/e2e/proactive.spec.ts`（订阅通知 -> 等待主动消息 -> 点击跳转对话）

## Protected Region
- `server/app/services/proactive/scheduler.py` - 调度逻辑（定时/事件触发）
- `server/app/services/proactive/generator.py` - 主动消息生成（LLM + 兜底）
- `server/app/services/proactive/push.py` - Web Push 推送（VAPID 签名）

## 备注
- PushSubscription 表：id / user_id / endpoint / p256dh / auth / created_at
- **需生成 VAPID key pair**（npx web-push generate-vapid-keys 或 pywebpush 库）
- Message.role 扩展：user / assistant / proactive（角色主动发起）
- APScheduler 触发类型：
  - 定时：早安(8:00-10:00 随机) / 晚安(22:00-23:00 随机) / 随机问候(每日 1-2 次)
  - 事件：久未上线(>24h) -> 主动关心
- 兜底文案库：每个时段 5-10 条预设，LLM 失败时随机选
- Web Push 流程：前端 subscribe -> 提交 subscription 到后端 -> 后端 pywebpush 推送
- Service Worker：接收 push -> 显示通知 -> 点击跳转 /chat/{conversation_id}
- 主动消息存入 Message（role=proactive），用户上线时对话页自动展示
- 同日 <=3 条限制：查询当日 proactive 消息数，超限跳过
- 本切片不含：情绪触发主动关心（009，P1）
