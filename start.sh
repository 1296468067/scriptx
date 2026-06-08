#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   ScriptX - 爆款脚本拆解 × 即梦提示词  ║"
echo "╚══════════════════════════════════════╝"
echo ""

# 首次运行：自动配置环境
bash setup.sh
if [ $? -ne 0 ]; then exit 1; fi

# 设置 tools 路径
export PATH="$SCRIPT_DIR/tools/node/bin:$SCRIPT_DIR/tools/ffmpeg/bin:$PATH"

echo "[启动] 正在启动 ScriptX..."
echo "[启动] 访问地址：http://localhost:3000"
echo "[启动] 按 Ctrl+C 停止"
echo ""

npm run dev
