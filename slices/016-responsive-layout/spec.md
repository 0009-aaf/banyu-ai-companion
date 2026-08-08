# Slice 016: responsive-layout

> 响应式布局骨架 - 桌面端侧边栏 + 内容页 max-width 居中 + 角色网格

## 目标

在现有移动端 UI 基础上，加 `md:` 断点实现桌面端（≥768px）响应式适配。移动端保持不变。

## 桌面端布局

```
┌──────┬──────────────────────┐
│ 伴语  │                      │
│      │   内容区              │
│ 对话  │   (max-w 居中)        │
│ 角色  │                      │
│ 日记  │                      │
│ 我的  │                      │
│      │                      │
│ 退出  │                      │
└──────┴──────────────────────┘
 240px        flex-1
```

## 改动清单

### 1. `web/app/(app)/layout.tsx`（核心）

- 现有 `<nav>` 底部导航加 `md:hidden`（移动端专属）
- 新增 `<aside className="hidden md:flex md:w-60 md:flex-col">` 桌面侧边栏：
  - Logo "伴语"（暖金色）
  - 4 个导航项垂直排列（`block rounded-lg px-3 py-2`，高亮用 `bg-[#f0c958]/10 text-[#f0c958]`）
  - 底部退出按钮（调用 `useAuthStore` 的 `logout` + `router.replace("/login")`）
- 外层 `<div>` 从 `flex min-h-screen flex-col` 改为 `flex min-h-screen`（横向）
- 内容区包一层 `<div className="flex flex-1 flex-col">`（main + 移动端 nav）

### 2. `web/features/chat/chat-view.tsx`

- 外层高度：`h-[calc(100vh-49px)]` -> `h-[calc(100vh-49px)] md:h-screen`
- 消息列表容器：加 `md:max-w-3xl md:mx-auto`
- 底部输入区：加 `md:max-w-3xl md:mx-auto`

### 3. `web/app/(app)/characters/page.tsx`

- 卡片列表：`space-y-3` -> `grid gap-3 md:grid-cols-2 lg:grid-cols-3`
- 外层加 `md:max-w-4xl md:mx-auto`

### 4. `web/app/(app)/characters/new/page.tsx`

- `<div className="p-4">` -> `<div className="p-4 md:max-w-2xl md:mx-auto">`

### 5. `web/app/(app)/characters/[id]/edit/page.tsx`

- `<div className="p-4">` -> `<div className="p-4 md:max-w-2xl md:mx-auto">`

### 6. `web/app/(app)/settings/page.tsx`

- `<div className="p-4">` -> `<div className="p-4 md:max-w-2xl md:mx-auto">`

### 7. `web/app/(app)/diary/page.tsx`

- `<div className="p-4">` -> `<div className="p-4 md:max-w-2xl md:mx-auto">`

### 8. `web/app/(app)/settings/notifications/page.tsx`

- 两处 `<div className="p-4">` -> `<div className="p-4 md:max-w-2xl md:mx-auto">`

### 9. `web/app/(app)/settings/memory/page.tsx`

- `<div className="p-4">` -> `<div className="p-4 md:max-w-2xl md:mx-auto">`

### 10. `web/features/call/call-view.tsx`

- 外层加 `md:max-w-md md:mx-auto`

### 11. `web/app/(app)/chat/page.tsx`

- 加 `md:max-w-3xl md:mx-auto md:h-screen md:flex md:items-center md:justify-center`

## 验收标准

- [ ] 桌面端（≥768px）显示左侧侧边栏，底部导航隐藏
- [ ] 移动端（<768px）保持底部导航，侧边栏隐藏
- [ ] 侧边栏 4 个导航项可切换页面，当前页高亮
- [ ] 侧边栏底部有退出按钮，点击退出并跳转登录页
- [ ] 角色页桌面端 2-3 列网格
- [ ] 各内容页桌面端居中，不拉伸全宽
- [ ] 通话页桌面端居中卡片
- [ ] 聊天页桌面端内容居中，高度占满屏幕
- [ ] 移动端所有功能不受影响

## 依赖

- 010（UI 重做 - 暗色主题基础）

## 不改动

- 后端 API
- globals.css 暗色主题变量
- store.ts / voice 组件 / auth layout
