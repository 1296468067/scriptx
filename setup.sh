#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TOOLS_DIR="$SCRIPT_DIR/tools"
DONE_MARKER="$TOOLS_DIR/.setup_done"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   ScriptX 环境自动配置                ║"
echo "╚══════════════════════════════════════╝"
echo ""

# 如果已完成配置，跳过
if [ -f "$DONE_MARKER" ]; then
    echo "[完成] 环境已配置，跳过安装"
    exit 0
fi

mkdir -p "$TOOLS_DIR"

# ===== 检测系统 =====
OS="$(uname -s)"
ARCH="$(uname -m)"
case "$OS" in
    Darwin*) PLATFORM="macos" ;;
    Linux*)  PLATFORM="linux" ;;
    *)       echo "[错误] 不支持的系统: $OS"; exit 1 ;;
esac

# ===== 安装 Node.js =====
if command -v node &>/dev/null; then
    echo "[跳过] 系统已安装 Node.js $(node -v)"
else
    NODE_DIR="$TOOLS_DIR/node"
    if [ -f "$NODE_DIR/bin/node" ]; then
        echo "[跳过] Node.js 已下载"
    else
        echo "[下载] 正在下载 Node.js ..."
        if [ "$PLATFORM" = "macos" ]; then
            if [ "$ARCH" = "arm64" ]; then
                NODE_URL="https://nodejs.org/dist/v20.18.1/node-v20.18.1-darwin-arm64.tar.gz"
            else
                NODE_URL="https://nodejs.org/dist/v20.18.1/node-v20.18.1-darwin-x64.tar.gz"
            fi
        else
            NODE_URL="https://nodejs.org/dist/v20.18.1/node-v20.18.1-linux-x64.tar.gz"
        fi
        curl -L "$NODE_URL" -o "$TOOLS_DIR/node.tar.gz" 2>/dev/null || {
            echo "[错误] 下载 Node.js 失败，请检查网络"
            exit 1
        }
        echo "[解压] 正在解压 Node.js ..."
        mkdir -p "$NODE_DIR"
        tar xzf "$TOOLS_DIR/node.tar.gz" -C "$TOOLS_DIR/node_tmp" --strip-components=1 2>/dev/null
        mv "$TOOLS_DIR/node_tmp/"* "$NODE_DIR/" 2>/dev/null
        rm -rf "$TOOLS_DIR/node_tmp" "$TOOLS_DIR/node.tar.gz"
        echo "[完成] Node.js 安装完成"
    fi
    export PATH="$NODE_DIR/bin:$PATH"
fi

# ===== 安装 ffmpeg =====
if command -v ffmpeg &>/dev/null; then
    echo "[跳过] 系统已安装 ffmpeg"
else
    FFMPEG_DIR="$TOOLS_DIR/ffmpeg"
    if [ -f "$FFMPEG_DIR/bin/ffmpeg" ]; then
        echo "[跳过] ffmpeg 已下载"
    else
        echo "[下载] 正在下载 ffmpeg ..."
        if [ "$PLATFORM" = "macos" ]; then
            if [ "$ARCH" = "arm64" ]; then
                FFMPEG_URL="https://www.osxexperts.net/ffmpeg7arm.zip"
            else
                FFMPEG_URL="https://evermeet.cx/ffmpeg/ffmpeg-7.0.zip"
            fi
        else
            FFMPEG_URL="https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz"
        fi
        curl -L "$FFMPEG_URL" -o "$TOOLS_DIR/ffmpeg_pkg" 2>/dev/null || {
            echo "[警告] ffmpeg 下载失败，视频处理功能将不可用"
            echo "[提示] 可手动安装: brew install ffmpeg 或 apt install ffmpeg"
        }
        if [ -f "$TOOLS_DIR/ffmpeg_pkg" ]; then
            mkdir -p "$FFMPEG_DIR/bin"
            if [ "$PLATFORM" = "linux" ]; then
                tar xJf "$TOOLS_DIR/ffmpeg_pkg" -C "$TOOLS_DIR/ffmpeg_tmp" --strip-components=1 2>/dev/null
                mv "$TOOLS_DIR/ffmpeg_tmp/ffmpeg" "$FFMPEG_DIR/bin/" 2>/dev/null
                mv "$TOOLS_DIR/ffmpeg_tmp/ffprobe" "$FFMPEG_DIR/bin/" 2>/dev/null
            else
                unzip -q "$TOOLS_DIR/ffmpeg_pkg" -d "$FFMPEG_DIR/bin/" 2>/dev/null
            fi
            rm -rf "$TOOLS_DIR/ffmpeg_tmp" "$TOOLS_DIR/ffmpeg_pkg"
            chmod +x "$FFMPEG_DIR/bin/ffmpeg" "$FFMPEG_DIR/bin/ffprobe" 2>/dev/null
            echo "[完成] ffmpeg 安装完成"
        fi
    fi
    if [ -f "$FFMPEG_DIR/bin/ffmpeg" ]; then
        export PATH="$FFMPEG_DIR/bin:$PATH"
        export FFMPEG_PATH="$FFMPEG_DIR/bin/ffmpeg"
        export FFPROBE_PATH="$FFMPEG_DIR/bin/ffprobe"
    fi
fi

# ===== 检查 whisper（可选）=====
if command -v python3 &>/dev/null || command -v python &>/dev/null; then
    PYTHON_CMD=$(command -v python3 || command -v python)
    if $PYTHON_CMD -c "import whisper" 2>/dev/null; then
        echo "[跳过] whisper 已安装"
    else
        echo "[提示] whisper 未安装（可选，不影响核心功能）"
    fi
else
    echo "[提示] Python 未安装，whisper 不可用（可选）"
fi

# ===== 安装 npm 依赖 =====
echo ""
echo "[安装] 正在安装项目依赖..."
cd "$SCRIPT_DIR"
npm install 2>/dev/null || {
    echo "[错误] npm install 失败"
    exit 1
}
echo "[完成] 依赖安装完成"

# ===== 检查 .env.local =====
if [ ! -f "$SCRIPT_DIR/.env.local" ]; then
    echo ""
    echo "[配置] 正在创建配置文件..."
    cat > "$SCRIPT_DIR/.env.local" << 'EOF'
# AI API 配置（必填）
AI_API_BASE_URL=https://copilot.huya.info/api/anthropic/
AI_API_KEY=sk-你的key填在这里
AI_MODEL=claude-sonnet-4-20250514
EOF
    echo "[提示] 已创建 .env.local，请编辑填入你的 AI_API_KEY"
    echo "[提示] 文件位置: $SCRIPT_DIR/.env.local"
    if command -v nano &>/dev/null; then
        read -p "是否现在编辑？(y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            nano "$SCRIPT_DIR/.env.local"
        fi
    fi
    echo "[提示] 填写完成后重新运行 start.sh"
    exit 0
fi

# 标记完成
touch "$DONE_MARKER"

echo ""
echo "[完成] 环境配置完成！"
echo ""
