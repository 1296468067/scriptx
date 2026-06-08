# ScriptX — 爆款脚本拆解 × 即梦提示词生成

上传 MP4 视频，自动拆解脚本结构，一键生成即梦 AI 视频提示词（文生+图生）。

## 功能

- 🎬 **自动脚本拆解** — 上传视频，AI 自动识别分镜、情绪曲线、钩子、内容结构
- ✨ **即梦提示词生成** — 为每个分镜生成文生视频 + 图生视频提示词
- 📋 **一键复制/导出** — 复制全部、导出 Markdown、导出 JSON
- ✏️ **在线编辑** — 脚本拆解和提示词均可在线修改
- 📚 **模板库** — 6 种场景模板（口播/美食/电商/短剧/仙侠/通用），一键套用
- 📂 **历史记录** — 自动保存分析结果，随时查看
- 🔗 **分享链接** — 生成分享链接，他人可查看完整拆解报告

---

## 快速开始

### Windows 用户

1. 安装 [Node.js](https://nodejs.org/)（选 LTS 版本）
2. 下载并解压项目文件
3. 双击运行 `start.bat`
4. 首次运行会自动安装依赖并提示填写 API Key
5. 浏览器打开 http://localhost:3000

### macOS / Linux 用户

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入 AI_API_KEY

# 3. 启动
npm run dev
```

---

## 环境变量

在项目根目录创建 `.env.local` 文件：

```env
AI_API_BASE_URL=https://copilot.huya.info/api/anthropic/
AI_API_KEY=sk-你的key
AI_MODEL=claude-sonnet-4-20250514
```

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `AI_API_KEY` | ✅ | - | AI API Key |
| `AI_API_BASE_URL` | ❌ | `https://copilot.huya.info/api/anthropic/` | API 地址 |
| `AI_MODEL` | ❌ | `claude-sonnet-4-20250514` | 模型名称 |
| `FFMPEG_PATH` | ❌ | `ffmpeg` | ffmpeg 路径 |
| `FFPROBE_PATH` | ❌ | `ffprobe` | ffprobe 路径 |

## 前置依赖

- **Node.js** 20+ — https://nodejs.org/
- **ffmpeg** — 视频处理（提取关键帧、音频）
  - Windows: 下载 https://www.gyan.dev/ffmpeg/builds/ ，解压后将 `bin` 目录加入系统 PATH
  - macOS: `brew install ffmpeg`
  - Linux: `sudo apt install ffmpeg`
- **Python 3** + whisper（可选）— 语音转文字，不装也能用

## 技术栈

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Claude API · ffmpeg · whisper

## 项目结构

```
src/
├── app/
│   ├── page.tsx              # 主工作台
│   ├── templates/page.tsx    # 模板库
│   ├── history/page.tsx      # 历史记录
│   ├── share/[id]/page.tsx   # 分享页
│   └── api/                  # API 路由
├── components/               # UI 组件
├── lib/                      # 工具函数 + AI 客户端
└── data/                     # 静态数据（模板、场景词库）
```
