# 伴语 (Banyu) — AI 陪伴 Agent

> 一个有性格的虚拟角色，会主动来找你聊，提供情绪支持。

## 功能

- **角色系统** — 创建专属 AI 角色，自定义人设、头像、声音
- **流式聊天** — 实时流式对话，支持多 LLM Provider
- **语音通话** — 全屏语音通话界面，樱花飘落特效
- **语音合成** — Edge TTS 6 种 Neural 语音包，免费可商用
- **连续语音** — 按住说话，ASR 识别 + TTS 自动播放
- **长期记忆** — 自动提取关键信息，跨会话记忆
- **主动陪伴** — 定时早安/晚安/随机问候，Web Push 推送
- **心情日记** — 记录每日心情，5 种情绪标记
- **情绪触发** — 分析用户情绪，低落时主动关心
- **动态粒子背景** — 萤火星空（全局）+ 樱花飘落（通话页）
- **响应式布局** — 桌面端侧边栏三栏 + 移动端底部导航

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | Next.js 16 + React 19 + TypeScript + Tailwind 4 + Zustand |
| 后端 | FastAPI (Python) + SQLAlchemy async + aiosqlite |
| LLM | 多 Provider 适配（火山引擎 Coding / 智谱 Coding / 千问 Token / OpenAI / DeepSeek / 豆包） |
| TTS | Edge TTS（免费 Neural 语音，6 种声音） |
| 语音 | Web Speech API (ASR) + Edge TTS (TTS) |
| 移动端 | Capacitor (Android APK) |

## 快速开始

### 后端

```bash
cd server
pip install -r requirements.txt
cp .env.example .env  # 编辑 .env 填入配置
python -m uvicorn app.main:app --port 8000
```

### 前端

```bash
cd web
npm install
npm run dev
```

访问 http://localhost:3000

### 配置 LLM

1. 注册账号
2. 进入"我的"页面
3. 选择 Provider（火山引擎 Coding / 智谱 Coding / 千问 Token Plan 等）
4. 填入 API Key 并保存
5. 选择模型
6. 开始聊天

## 两个版本

### Web 版

直接运行后端 + 前端，浏览器访问。

### Android 版

下载 APK 安装包：

👉 **[banyu-app-debug.apk](https://github.com/0009-aaf/banyu-ai-companion/releases/latest)**

安装步骤：
1. 下载 APK 文件
2. 手机设置中允许"安装未知来源应用"
3. 安装 APK
4. 确保电脑运行后端服务（端口 8000 + 3000）
5. 手机和电脑在同一局域网
6. 首次打开 App，在设置页配置 LLM API Key

## LLM Provider

| Provider | 说明 |
|----------|------|
| 火山引擎 Coding | 7 模型（deepseek/kimi/glm） |
| 智谱 Coding Plan | GLM 系列 |
| 千问 Token Plan | 多厂商模型 |
| OpenAI | 标准 API |
| DeepSeek | 标准 API |
| 豆包 | 标准 ARK |
| 通义千问 | 标准 API |
| 智谱 | 标准 API |

## TTS 语音包

| 语音 | 风格 |
|------|------|
| 晓晓 | 温柔女声 |
| 晓伊 | 活泼女声 |
| 云希 | 少年男声 |
| 云扬 | 解说男声 |
| 晓曼 | 粤语女声 |
| 云龙 | 粤语男声 |

## 项目结构

```
banyu/
├── web/              # Next.js 前端
│   ├── app/          # App Router 页面
│   ├── components/   # 粒子背景等组件
│   ├── features/     # 聊天/语音/上传等功能模块
│   └── lib/          # API client + Zustand store
├── server/           # FastAPI 后端
│   ├── app/
│   │   ├── api/      # 路由（auth/chat/characters/tts/...）
│   │   ├── core/     # 配置/数据库/安全/加密
│   │   ├── models/   # ORM 模型
│   │   └── services/ # LLM 适配/记忆/TTS/情绪/主动陪伴
│   └── requirements.txt
└── web/android/      # Capacitor Android 项目
```
