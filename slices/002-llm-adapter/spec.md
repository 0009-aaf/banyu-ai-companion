# 切片: LLM 适配层

## 编号
slice-002

## 前置依赖
- slice-001（鉴权 + User 表 + 配置体系）

## 目标
实现多 LLM Provider 适配层：统一接口（chat_stream / list_models / embed），用户配置 API key（AES 加密存储），`/models` 聚合返回可用模型。

## 涉及文件（本切片独占）

### server/
- `server/app/services/llm/base.py` - Provider 抽象接口 ★Protected
- `server/app/services/llm/providers/openai.py` - OpenAI 适配器
- `server/app/services/llm/providers/doubao.py` - 豆包（火山引擎）适配器
- `server/app/services/llm/providers/qwen.py` - 通义适配器
- `server/app/services/llm/providers/deepseek.py` - DeepSeek 适配器
- `server/app/services/llm/providers/zhipu.py` - 智谱适配器
- `server/app/services/llm/providers/gemini.py` - Gemini 适配器
- `server/app/services/llm/registry.py` - Provider 注册表 + /models 聚合 ★Protected
- `server/app/core/crypto.py` - AES 加解密 ★Protected
- `server/app/models/llm_key.py` - LlmKey ORM
- `server/app/schemas/llm_config.py` - Pydantic
- `server/app/api/llm_config.py` - key 配置 + /models 路由
- `server/alembic/versions/xxx_add_llm_key.py` - LlmKey 迁移

### web/
- `web/app/(app)/settings/page.tsx` - 设置页（key 配置 + 模型选择）
- `web/features/settings/llm-config-form.tsx` - key 配置表单
- `web/features/settings/model-selector.tsx` - 模型下拉选择

## 共享文件（追加式修改）
- `server/app/main.py` - 挂载 llm_config router
- `web/lib/store.ts` - Zustand 存储当前选中模型（后续切片读取）

## 验收标准
- [ ] 用户在设置页填入 OpenAI key -> 保存 -> /models 返回该 key 下可用模型
- [ ] key 在数据库 AES 加密存储，明文不出现在日志/响应
- [ ] 配置豆包 key -> /models 返回豆包模型
- [ ] 填入无效 key -> /models 返回错误，提示"key 无效"
- [ ] 切换模型 -> 当前模型存入 Zustand，刷新后保留
- [ ] chat_stream 接口可调通（本切片仅验证可调，UI 在 004）
- [ ] 至少 2 个 provider 适配器可正常 list_models（OpenAI + 豆包）

## 测试 anchor
- 单元测试：`server/tests/unit/test_crypto.py`（加解密往返）
- 单元测试：`server/tests/unit/test_providers.py`（消息格式转换）
- 集成测试：`server/tests/integration/test_llm_config.py`（key CRUD + /models）

## Protected Region
- `server/app/services/llm/base.py` - Provider 抽象接口（契约层）
- `server/app/services/llm/providers/*.py` - 各适配器（key/流式协议）
- `server/app/services/llm/registry.py` - 聚合逻辑
- `server/app/core/crypto.py` - 加解密

## 备注
- base.py 接口：`async def chat_stream(messages, model) -> AsyncIterator[str]`、`async def list_models() -> list[str]`、`async def embed(text) -> list[float]`
- 各适配器统一 OpenAI 兼容消息格式（role/content），内部抹平差异
- 流式统一转 SSE（004 切片消费）
- LlmKey 表：id / user_id / provider / api_key_encrypted
- 环境变量：`ENCRYPT_KEY`（AES 主密钥，不入库）
