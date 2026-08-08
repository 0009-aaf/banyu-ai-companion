# 切片: 语音对话

## 编号
slice-007

## 前置依赖
- slice-004（流式聊天，对话页输入栏）

## 目标
实现语音对话：用户点击语音按钮 -> Web Speech API ASR 识别 -> 填入输入框 -> 发送 -> 角色回复 -> TTS 播放语音。纯前端切片（浏览器原生 API）。

## 涉及文件（本切片独占）

### web/
- `web/features/voice/voice-input.ts` - ASR 封装（SpeechRecognition）★Protected
- `web/features/voice/voice-output.ts` - TTS 封装（SpeechSynthesis）★Protected
- `web/features/voice/voice-toggle.tsx` - 语音/文字切换按钮
- `web/features/chat/message-input.tsx` - 输入栏加语音按钮 + ASR 状态

## 共享文件（追加式修改）
- `web/features/chat/chat-view.tsx` - 角色回复后触发 TTS
- `web/lib/store.ts` - 语音偏好 state（voiceEnabled）

## 验收标准
- [ ] 点击语音按钮 -> ASR 识别 -> 识别文本填入输入框
- [ ] 发送后角色回复 -> TTS 自动播放语音
- [ ] ASR 识别失败 -> 提示"没听清，再说一次"
- [ ] TTS 不可用 -> 仅文字显示（不阻断对话）
- [ ] 浏览器不支持 Web Speech -> 隐藏语音按钮
- [ ] 语音输入 ≤60s 自动停止
- [ ] 可手动切换语音/文字输入模式
- [ ] TTS 播放时可中断（点击停止）

## 测试 anchor
- 单元测试：`web/features/voice/__tests__/voice-input.test.ts`（ASR 状态管理）
- 单元测试：`web/features/voice/__tests__/voice-output.test.ts`（TTS 状态管理）
- E2E：`web/e2e/voice.spec.ts`（语音按钮 -> 识别 -> 发送 -> TTS）

## Protected Region
- `web/features/voice/voice-input.ts` - ASR 封装（浏览器兼容性处理）
- `web/features/voice/voice-output.ts` - TTS 封装（语音合成控制）

## 备注
- 纯前端切片，无需后端改动
- Web Speech API：SpeechRecognition（ASR）+ SpeechSynthesis（TTS）
- 浏览器兼容：Chrome/Edge 支持最好，Safari 部分，Firefox 不支持
- ASR 语言：zh-CN（中文识别）
- TTS 语言：zh-CN，角色音色可选
- 语音输入 60s 限制：SpeechRecognition 设置 continuous=true, interimResults=true
- 识别中状态：输入框显示实时识别文本（灰色），完成后变为可编辑
- TTS 播放：角色回复完成后自动播放，可配置开关
