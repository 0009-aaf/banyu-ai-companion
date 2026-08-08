# 切片: 角色系统

## 编号
slice-003

## 前置依赖
- slice-001（鉴权 + User 表）

## 目标
实现角色卡 CRUD + 内置默认角色 + 角色切换。角色卡含人设/头像/声音/主动触发配置。

## 涉及文件（本切片独占）

### server/
- `server/app/models/character.py` - Character ORM
- `server/app/schemas/character.py` - Pydantic
- `server/app/api/characters.py` - 角色 CRUD 路由
- `server/app/services/character/default.py` - 内置默认角色定义 + seed ★Protected
- `server/alembic/versions/xxx_add_character.py` - Character 迁移

### web/
- `web/app/(app)/characters/page.tsx` - 角色管理页（列表）
- `web/app/(app)/characters/new/page.tsx` - 创建角色
- `web/app/(app)/characters/[id]/edit/page.tsx` - 编辑角色
- `web/features/character/character-card.tsx` - 角色卡片
- `web/features/character/character-form.tsx` - 创建/编辑表单
- `web/lib/store.ts` - Zustand 当前选中角色（追加）

## 共享文件（追加式修改）
- `server/app/main.py` - 挂载 characters router
- `web/app/(app)/layout.tsx` - 角色 tab 项

## 验收标准
- [ ] 新用户注册后自动获得 1 个内置默认角色（is_default=true）
- [ ] 创建角色卡 -> 填人设/头像/声音/触发配置 -> 保存成功
- [ ] 人设为空 -> 阻止保存，提示"人设不能为空"
- [ ] 人设 >2000 字 -> 提示"人设最多 2000 字"
- [ ] 角色卡数量上限 20 -> 超出提示"角色数量已达上限"
- [ ] 编辑/删除角色卡正常
- [ ] 默认角色不可删除（is_default=true -> 删除返回 403）
- [ ] 切换角色 -> 当前角色存入 Zustand，刷新后保留
- [ ] 头像上传失败 -> 使用默认头像，不阻断保存

## 测试 anchor
- 单元测试：`server/tests/unit/test_character_service.py`（校验/上限/默认保护）
- 集成测试：`server/tests/integration/test_characters.py`（CRUD + 默认角色 seed）
- E2E：`web/e2e/character.spec.ts`（创建 -> 编辑 -> 删除 -> 切换）

## Protected Region
- `server/app/services/character/default.py` - 默认角色人设（产品核心资产）

## 备注
- Character 表：id / user_id / name / persona(text) / avatar_url / voice_config(jsonb) / proactive_config(jsonb) / is_default(bool)
- proactive_config 结构：`{ schedule: {morning/evening/random: bool, times: []}, events: {offline_days: int, emotion_threshold: float} }`
- 默认角色人设方向：温柔、有共情力、主动关心的陪伴者（具体人设文案在 default.py）
- 本切片不实现对话，仅角色卡管理；对话在 004
