# 切片: 语音电话 - 连续模式

## 编号
slice-013

## 前置依赖
- slice-010（UI 重做）

## 功能描述
用户按住说话 -> ASR 识别 -> 自动发送 -> LLM 回复 -> TTS 播放 -> 继续按住说话。
不打字，全程语音对话，但不是实时通话（每次按住说话是一次完整的请求-回复循环）。

## 涉及文件
- `web/features/voice/voice-continuous.tsx` - 连续语音模式组件
- `web/features/voice/voice-input.ts` - 扩展 ASR（增加自动发送回调）
- `web/features/voice/voice-output.ts` - 扩展 TTS（增加播放完毕回调）

## 共享文件
- `web/features/chat/chat-view.tsx` - 增加连续语音模式切换（文字/按住说话/语音电话）
- `web/lib/store.ts` - 增加 voiceMode 状态（text/continuous/call）

## 验收标准
- [ ] 聊天页底部有模式切换（文字 / 按住说话）
- [ ] 按住说话模式：按住按钮 -> 录音 -> ASR 识别 -> 松开自动发送
- [ ] LLM 回复后自动 TTS 播放
- [ ] TTS 播放完毕后可以继续按住说话
- [ ] ASR 识别中显示"正在听..."状态
- [ ] TTS 播放中显示"正在说话..."状态 + 可中断
- [ ] 浏览器不支持 Web Speech -> 隐藏语音按钮

## 测试 anchor
- 浏览器验证：切换到按住说话模式 -> 按住说话 -> 松开 -> 自动发送 -> TTS 播放

## Protected Region
- 无（前端组件，可自由实现）
