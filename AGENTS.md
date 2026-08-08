# AGENTS.md - 伴语 (Banyu)

> 主动式 AI 陪伴产品。一个有性格的虚拟角色，会主动来找你聊，提供情绪支持。

## 项目信息
- **项目名称**：伴语 (Banyu)
- **定位**：主动式 AI 陪伴（垂直角色 IP + 主动式陪伴 + 情绪支持）
- **平台**：Web 优先(PWA) -> 后续 Capacitor(移动) / Tauri(桌面)

## 技术栈
| 层 | 选型 |
|----|------|
| 前端 | Next.js 16 (App Router) + TypeScript + Tailwind 4 + Zustand + PWA |
| 后端 | FastAPI (Python) + SQLAlchemy async + aiosqlite |
| LLM | 多 Provider 适配层（OpenAI/豆包/火山Coding/通义/DeepSeek/智谱），用户配 API key，模型列表过滤 |
| 语音 | Web Speech API (ASR+TTS) + 火山引擎 TTS (声音克隆) + WebSocket (实时通话) |
| 文件存储 | 本地文件系统（server/uploads/） |
| 数据库 | SQLite（开发）-> Postgres（生产） |
| 主动陪伴 | APScheduler + Web Push |
| 部署 | 本地优先（不用云服务器）|

## 项目结构
```
banyu/
├── web/          # Next.js 前端
├── server/       # FastAPI 后端
├── docs/         # PRD/架构/状态
└── references/   # 视觉参考截图
```

## 文档
- PRD: `docs/01-PRD.md`
- 架构: `docs/02-ARCHITECTURE.md`
- 状态: `docs/03-STATUS.md`

## 编码规范
遵循全局编码底线（入口判空 / 精准修改 / catch 必处理 / 异常不吞）：
- 前端 `.tsx` -> React 规范
- 后端 Python -> coding-standards §6.2
- 详见 `~/.claude/CLAUDE.md`

## 变更记录
| 日期 | 变更 |
|------|------|
| 2026-08-08 | 项目初始化，vibe-plan 完成 |
