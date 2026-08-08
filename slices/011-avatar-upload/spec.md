# 切片: 角色形象上传（图片）

## 编号
slice-011

## 前置依赖
- slice-010（UI 重做）

## 功能描述
用户创建/编辑角色时上传图片作为角色头像/立绘，对话页/通话页展示该图片。

## 涉及文件
- `server/app/api/upload.py` - 文件上传 API（图片上传 + 静态文件服务）
- `server/app/services/upload/image.py` - 图片处理（保存 + 大小校验 + 格式校验）
- `server/uploads/avatars/` - 头像存储目录
- `server/app/main.py` - 挂载静态文件路由 + upload router
- `web/features/upload/image-upload.tsx` - 图片上传组件（选择 + 预览 + 裁剪）
- `web/features/character/character-form.tsx` - 角色表单增加图片上传（如不存在则创建）

## 共享文件
- `server/app/models/character.py` - 增加 avatar_url 字段
- `server/app/schemas/character.py` - 增加 avatar_url
- `server/app/api/characters.py` - 创建/编辑角色时接收 avatar_url
- `web/app/(app)/characters/page.tsx` - 角色卡片展示头像
- `web/features/chat/chat-view.tsx` - 对话页顶部展示角色头像
- `web/features/chat/message-bubble.tsx` - 角色消息旁显示头像

## 验收标准
- [ ] 上传图片 -> 保存到 uploads/avatars/ -> 返回 URL
- [ ] 图片格式校验（JPG/PNG/WebP）
- [ ] 图片大小限制（≤5MB）
- [ ] 角色创建/编辑页有图片上传组件（选择 + 预览）
- [ ] 角色卡片显示上传的头像（无头像时显示首字母圆形）
- [ ] 对话页顶部显示角色头像
- [ ] 角色消息旁显示小头像
- [ ] 静态文件服务（/uploads/avatars/xxx.jpg 可访问）

## 测试 anchor
- API 测试：POST /api/upload/image 上传图片
- 浏览器验证：角色创建页上传图片 + 角色列表显示头像 + 对话页显示头像

## Protected Region
- `server/app/services/upload/image.py` - 文件处理逻辑
