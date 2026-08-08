# 切片: 情绪识别触发

## 编号
slice-009

## 前置依赖
- slice-004（流式聊天，用户消息分析）
- slice-006（主动陪伴，主动消息生成 + 推送）

## 目标
实现情绪识别触发：LLM 分析用户消息情绪 -> 负面得分超阈值 -> 触发角色主动关心消息。避免重复触发，正面情绪不触发。

## 涉及文件（本切片独占）

### server/
- `server/app/models/emotion_log.py` - EmotionLog ORM（id / user_id / message_id / emotion / score / created_at）
- `server/app/schemas/emotion.py` - Pydantic
- `server/app/services/emotion/analyzer.py` - 情绪分析（LLM 分类）★Protected
- `server/app/services/emotion/trigger.py` - 触发逻辑（阈值 + 去重）★Protected

## 共享文件（追加式修改）
- `server/app/api/chat.py` - 对话完成后异步情绪分析
- `server/app/services/proactive/generator.py` - 情绪触发主动消息生成
- `server/app/main.py` - 无需额外挂载（emotion 是内部服务）

## 验收标准
- [ ] 用户消息 -> 情绪分析（LLM 分类 + 得分）
- [ ] 负面得分 >阈值 -> 触发角色主动关心消息
- [ ] 主动关心消息符合角色人设
- [ ] 避免重复触发（同会话 ≤1 次主动关心）
- [ ] 阈值可调（config 配置项）
- [ ] 正面情绪不触发
- [ ] 情绪分析失败 -> 跳过不阻断对话
- [ ] 情绪记录持久化（EmotionLog）
- [ ] 主动关心消息通过应用内展示（不依赖 Web Push）

## 测试 anchor
- 单元测试：`server/tests/unit/test_emotion_analyzer.py`（情绪分类 + 得分）
- 单元测试：`server/tests/unit/test_emotion_trigger.py`（阈值 + 去重）
- 集成测试：`server/tests/integration/test_emotion_flow.py`（消息 -> 分析 -> 触发 -> 主动消息）
- E2E：`web/e2e/emotion.spec.ts`（发负面消息 -> 等待主动关心 -> 对话页查看）

## Protected Region
- `server/app/services/emotion/analyzer.py` - 情绪分析逻辑（LLM prompt + 分类）
- `server/app/services/emotion/trigger.py` - 触发逻辑（阈值判断 + 去重）

## 备注
- EmotionLog 表：id / user_id / message_id(FK) / emotion(string) / score(float) / created_at
- 情绪分类：positive / neutral / negative（负面细分 sad/anxious/angry）
- score：0.0-1.0，负面得分 >0.6 触发（阈值可调）
- LLM 分析 prompt：对用户消息进行情绪分类，返回 JSON {"emotion": "...", "score": 0.x}
- 去重：同会话查 EmotionLog，已有触发记录则跳过
- 触发后：生成主动关心消息（复用 006 的 generator），存入 Message（role=proactive）
- 异步分析：对话回复完成后，后台任务分析情绪，不阻塞 SSE 响应
- 主动关心消息：如"感觉你今天心情不太好，想聊聊吗？"
- 本切片不含：日记情绪分析（008 日记 mood 是用户自选，不需 LLM 分析）
