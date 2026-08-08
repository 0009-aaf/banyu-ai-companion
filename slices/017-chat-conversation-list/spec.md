# Slice 017: chat-conversation-list

> 聊天页桌面端会话列表侧栏 - 左侧会话历史 + 右侧聊天区域

## 目标

桌面端（≥768px）聊天页显示左侧会话列表，用户可切换历史会话或新建会话。移动端保持全屏单栏。

## 桌面端布局

```
┌──────┬────────────┬──────────────────┐
│ 伴语  │ 会话列表    │                  │
│      │            │   聊天区域        │
│ 对话  │ 小暖的对话  │   (ChatView)     │
│ 角色  │ 小暖的对话  │                  │
│ 日记  │            │                  │
│ 我的  │ + 新对话    │                  │
│ 退出  │            │                  │
└──────┴────────────┴──────────────────┘
 240px    240px          flex-1
```

## 改动清单

### 1. 新建 `web/features/chat/conversation-list.tsx`

- Props: `{ currentConvId: string | null }`
- 调用 `apiFetch<Conversation[]>("/chat/conversations")` 获取会话列表
- 每个会话项显示标题 + 时间，点击跳转 `/chat/{id}`
- 当前会话高亮（`bg-[#f0c958]/10`）
- 底部"+ 新对话"按钮 -> 跳转 `/chat`（入口页自动创建新会话）
- 空状态："还没有对话"
- 加载状态："加载中..."

### 2. 改造 `web/app/(app)/chat/[id]/page.tsx`

- 桌面端：左侧 `<ConversationList>` + 右侧 `<ChatView>`
- 移动端：只显示 `<ChatView>`（隐藏会话列表）
- 布局：`<div className="flex h-screen">` + `<aside className="hidden md:block md:w-60">` + `<div className="flex-1">`

```tsx
return (
  <div className="flex h-[calc(100vh-49px)] md:h-screen">
    <aside className="hidden md:block md:w-60 md:border-r border-white/10 overflow-y-auto">
      <ConversationList currentConvId={params.id} />
    </aside>
    <div className="flex-1 md:max-w-3xl md:mx-auto">
      <ChatView convId={params.id} initialMessages={messages} />
    </div>
  </div>
);
```

### 3. 改造 `web/app/(app)/chat/page.tsx`

- 桌面端：显示会话列表 + "选择或新建对话"提示
- 移动端：保持现有逻辑（自动跳转）

```tsx
return (
  <div className="flex h-[calc(100vh-49px)] md:h-screen">
    <aside className="hidden md:block md:w-60 md:border-r border-white/10 overflow-y-auto">
      <ConversationList currentConvId={null} />
    </aside>
    <div className="flex flex-1 items-center justify-center">
      {/* 现有 error / 加载中 内容 */}
    </div>
  </div>
);
```

### 4. 调整 `web/features/chat/chat-view.tsx`

- 桌面端会话列表已在外层处理 max-w，ChatView 内部的 `md:max-w-3xl md:mx-auto` 移除（避免双重居中）
- 高度保持 `h-[calc(100vh-49px)] md:h-screen`

## 数据模型

```typescript
interface Conversation {
  id: string;
  character_id: string;
  title: string;
  created_at: string;
}
```

## 验收标准

- [ ] 桌面端聊天页左侧显示会话列表
- [ ] 会话列表项显示标题，点击可切换会话
- [ ] 当前会话高亮
- [ ] "+ 新对话"按钮可创建新会话
- [ ] 移动端不显示会话列表，保持全屏聊天
- [ ] 会话列表为空时显示"还没有对话"
- [ ] 切换会话时聊天区域正确更新

## 依赖

- 016（responsive-layout - 布局骨架）

## 不改动

- 后端 API（`/chat/conversations` 已存在）
- ChatView 组件内部逻辑（只调 max-w）
