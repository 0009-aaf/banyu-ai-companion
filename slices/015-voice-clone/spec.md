# 切片: 声音克隆

## 编号
slice-015

## 前置依赖
- slice-011（图片上传 - 文件上传基础）
- slice-013（连续语音 - TTS 播放基础）

## 功能描述
用户上传 5-15 秒语音样本 -> 后端调用火山引擎 TTS 声音复刻 API 训练声音模型 -> 后续 TTS 用该声音说话。

## 涉及文件
- `server/app/services/voice/clone.py` - 声音克隆服务（调用火山引擎 API）
- `server/app/services/voice/tts.py` - TTS 服务（用克隆声音生成语音）
- `server/app/api/voice.py` - 声音克隆 API（上传语音 + 查询状态 + 生成 TTS）
- `web/features/upload/voice-upload.tsx` - 语音上传组件（录制/选择 + 预览 + 上传）

## 共享文件
- `server/app/models/character.py` - 增加 voice_id, voice_status 字段
- `server/app/schemas/character.py` - 增加 voice_id, voice_status
- `server/app/main.py` - 挂载 voice router
- `server/app/core/config.py` - 增加 VOLC_TTS_TOKEN 配置
- `web/features/voice/voice-output.ts` - TTS 播放改为调用后端 TTS API（有 voice_id 时）或浏览器 TTS（无 voice_id 时）
- `web/app/(app)/characters/page.tsx` 或 character-form - 角色编辑增加语音上传

## 验收标准
- [ ] 角色编辑页有语音上传组件（录制或选择文件）
- [ ] 上传语音 -> 保存到 uploads/voices/ -> 调用火山引擎声音复刻 API
- [ ] 声音克隆状态：none -> training -> ready/failed
- [ ] 状态为 ready 时，TTS 用克隆声音播放
- [ ] 状态为 none/failed 时，TTS 用浏览器默认声音
- [ ] 未配置 VOLC_TTS_TOKEN 时，跳过克隆，用浏览器 TTS（降级）
- [ ] 角色卡片/编辑页显示声音克隆状态

## 测试 anchor
- API 测试：POST /api/voice/clone 上传语音 -> 查询状态
- 降级测试：未配置 TTS token -> voice_status = "none" -> 浏览器 TTS

## Protected Region
- `server/app/services/voice/clone.py` - 声音克隆逻辑
- `server/app/services/voice/tts.py` - TTS 生成逻辑

## 注意
- 火山引擎声音复刻 API 需要额外的 TTS access token（非 ARK LLM key）
- 若用户未配置 TTS token，降级为浏览器内置 TTS
- 声音克隆可能需要 30s-2min 训练时间
