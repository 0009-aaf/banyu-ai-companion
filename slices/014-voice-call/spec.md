# 切片: 语音电话 - 实时通话

## 编号
slice-014

## 前置依赖
- slice-011（图片上传 - 通话页展示立绘）
- slice-013（连续语音 - 语音能力基础）

## 功能描述
点击"电话"按钮进入通话界面 -> VAD 自动检测说话 -> ASR -> LLM -> TTS 连续播放。
像打电话一样，全屏角色立绘 + 通话时长 + 挂断按钮。

## 涉及文件
- `server/app/api/voice_call.py` - WebSocket 端点（接收文字 -> LLM 流式 -> 返回 token）
- `web/app/(app)/call/page.tsx` - 通话页面（全屏立绘 + 通话时长 + 挂断）
- `web/features/call/call-view.tsx` - 通话组件（VAD + WebSocket + ASR + TTS）
- `web/features/call/vad.ts` - 语音活动检测（Web Audio API 检测说话开始/结束）

## 共享文件
- `server/app/main.py` - 挂载 voice_call WebSocket router
- `web/features/chat/chat-view.tsx` - 增加"电话"按钮入口

## 验收标准
- [ ] 对话页有"电话"按钮 -> 点击进入通话页面
- [ ] 通话页面全屏角色立绘 + 通话时长 + 挂断按钮
- [ ] VAD 自动检测用户说话开始/结束
- [ ] 说话结束 -> ASR 识别 -> WebSocket 发送文字到后端
- [ ] 后端 LLM 流式回复 -> 前端逐 token 显示文字
- [ ] LLM 回复完成 -> TTS 自动播放
- [ ] TTS 播放完毕 -> 继续监听用户说话（循环）
- [ ] 挂断 -> 返回对话页
- [ ] 通话中的对话保存到消息历史
- [ ] 说话时角色立绘有呼吸光效/动画

## 测试 anchor
- WebSocket 测试：连接 -> 发送文字 -> 收到 token 流
- 浏览器验证：进入通话 -> 说话 -> 角色回复 -> 挂断

## Protected Region
- `server/app/api/voice_call.py` - WebSocket 逻辑
- `web/features/call/vad.ts` - VAD 算法
