# 切片: 心情日记

## 编号
slice-008

## 前置依赖
- slice-001（基础鉴权）
- slice-005（记忆提取，日记关键信息入记忆）

## 目标
实现心情日记：用户记录每天心情/小事 -> 保存 -> 提取关键信息入记忆 -> 角色下次对话/主动消息引用日记内容。

## 涉及文件（本切片独占）

### server/
- `server/app/models/diary.py` - Diary ORM（id / user_id / entry_date / content / mood / is_private / created_at）
- `server/app/schemas/diary.py` - Pydantic
- `server/app/api/diary.py` - 日记 CRUD 路由

### web/
- `web/app/(app)/diary/page.tsx` - 日记页（今日编辑 + 历史列表）
- `web/app/(app)/diary/[date]/page.tsx` - 历史日记查看/编辑
- `web/features/diary/diary-editor.tsx` - 日记编辑组件（心情选择 + 文本）
- `web/features/diary/diary-list.tsx` - 历史日记列表

## 共享文件（追加式修改）
- `server/app/main.py` - 挂载 diary router
- `server/app/services/memory/extract.py` - 日记记忆提取（复用 extract_memory）
- `server/app/api/diary.py` - 保存日记后异步提取记忆
- `web/app/(app)/layout.tsx` - 日记 tab 已存在，激活路由
- `web/lib/store.ts` - 今日心情 state

## 验收标准
- [ ] 用户写日记 -> 选择心情 -> 填写内容 -> 保存
- [ ] 保存失败 -> 提示重试，不丢内容
- [ ] 日记 ≤1000 字（超长截断并提示）
- [ ] 支持查看历史日记（按日期浏览）
- [ ] 日记可设私密（is_private）
- [ ] 保存日记后提取关键信息入记忆
- [ ] 角色下次对话能引用日记内容（通过记忆注入）
- [ ] 每日一篇（同日期覆盖或提示）
- [ ] 心情选择：开心/平静/难过/焦虑/愤怒（emoji 或色彩）

## 测试 anchor
- 单元测试：`server/tests/unit/test_diary.py`（CRUD + 记忆提取）
- 集成测试：`server/tests/integration/test_diary_flow.py`（写日记 -> 记忆提取 -> 对话引用）
- E2E：`web/e2e/diary.spec.ts`（写日记 -> 查看 -> 对话引用）

## Protected Region
- 无特殊 Protected Region（日记 CRUD 是标准操作，记忆提取复用 005）

## 备注
- Diary 表：id / user_id / entry_date(date) / content(text) / mood(string) / is_private(bool) / created_at
- mood 字段：happy / calm / sad / anxious / angry（对应 emoji 和色彩）
- 每日一篇：entry_date 唯一约束（user_id + entry_date）
- 记忆提取：保存日记后，用 005 的 extract_memory 提取关键信息
- 角色引用：对话时记忆检索会匹配日记记忆，注入 system prompt
- 日记页布局：顶部今日心情 + 编辑区 + 底部历史列表（日期 + 心情图标）
- is_private：私密日记不参与记忆提取（用户隐私控制）
