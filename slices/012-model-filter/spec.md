# 切片: 模型列表过滤

## 编号
slice-012

## 前置依赖
- 无（独立改进）

## 功能描述
`/llm/models/{provider}` 只返回有效的对话类模型，过滤掉 embedding/vision/image/tts 等非对话模型。

## 涉及文件
- `server/app/services/llm/filter.py` - 模型过滤逻辑（关键词排除）

## 共享文件
- `server/app/api/llm_config.py` - list_models 调用过滤函数

## 验收标准
- [ ] 过滤规则：排除 embedding/vision/image/tts/asr/whisper/clip/multimodal/rerank/sd/dall/draw/paint/video/code/preview 关键词
- [ ] 过滤后只返回对话类模型（如 deepseek-v4-flash, doubao-pro-32k 等）
- [ ] 过滤后列表为空时返回空数组（前端显示"暂无可用模型"）
- [ ] 不影响 /models 端点本身（只是过滤返回结果）

## 测试 anchor
- 单元测试：filter_chat_models(["doubao-pro-32k", "doubao-embedding-text", "doubao-vision-pro"]) -> ["doubao-pro-32k"]
- API 测试：GET /api/llm/models/volc 确认返回的模型都是对话类

## Protected Region
- `server/app/services/llm/filter.py` - 过滤规则
