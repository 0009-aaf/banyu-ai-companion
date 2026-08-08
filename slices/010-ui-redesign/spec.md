# 切片: UI 重做 - 二次元暗色主题

## 编号
slice-010

## 前置依赖
- slice-001 ~ 009（全部已完成）

## 功能描述
将现有浅色网页风格 UI 重做为二次元/虚拟角色风格：
- 暗色底（#0a0a1a / #12122a）+ 暖色强调（暖金 #f0c958 / 暖粉 #e8a0bf）
- 毛玻璃卡片（backdrop-blur + 半透明）
- 角色卡片立绘展示风格
- 聊天气泡暗色风格
- 底部导航暗色风格
- 移动端 app 质感（不像网页）

## 涉及文件
- `web/app/globals.css` - 全局样式重写（暗色主题 + 配色变量）
- `web/app/layout.tsx` - 根布局（暗色 body）
- `web/app/(app)/layout.tsx` - 底部导航暗色风格
- `web/app/(app)/chat/page.tsx` - 聊天页暗色
- `web/app/(app)/characters/page.tsx` - 角色页暗色 + 立绘卡片
- `web/app/(app)/diary/page.tsx` - 日记页暗色
- `web/app/(app)/settings/page.tsx` - 设置页暗色
- `web/app/(app)/settings/notifications/page.tsx` - 通知页暗色
- `web/app/(app)/settings/memory/page.tsx` - 记忆页暗色
- `web/app/(auth)/login/page.tsx` - 登录页暗色
- `web/app/(auth)/register/page.tsx` - 注册页暗色
- `web/features/chat/chat-view.tsx` - 聊天视图暗色气泡
- `web/features/chat/message-bubble.tsx` - 消息气泡暗色

## 共享文件
- 无（本切片重写 UI 层，不影响后端）

## 验收标准
- [ ] 全局暗色主题（深色底 + 暖色强调）
- [ ] 所有页面暗色风格一致
- [ ] 聊天气泡暗色 + 圆角 + 角色头像
- [ ] 角色卡片有立绘展示风格（大图 + 暖色描边）
- [ ] 底部导航暗色 + 选中态暖色高亮
- [ ] 输入框/按钮暗色 + 圆角 + 暖色 focus
- [ ] 移动端 app 质感（触控友好、信息密度高、不像网页）
- [ ] 毛玻璃卡片效果（backdrop-blur）
- [ ] 空/error/loading 状态暗色风格

## 测试 anchor
- 浏览器验证：截图所有页面，确认暗色风格一致
- 移动端尺寸（390x844）验证触控友好

## Protected Region
- 无（UI 层可自由重写）
