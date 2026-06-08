@echo off
chcp 65001 >nul 2>&1
title ScriptX

echo.
echo  ╔══════════════════════════════════════╗
echo  ║   ScriptX - 爆款脚本拆解 × 即梦提示词  ║
echo  ╚══════════════════════════════════════╝
echo.

:: 检查 Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装：https://nodejs.org/
    pause
    exit /b 1
)

:: 检查 node_modules
if not exist "node_modules" (
    echo [提示] 首次运行，正在安装依赖...
    call npm install
    echo.
)

:: 检查 .env.local
if not exist ".env.local" (
    echo [提示] 未检测到配置文件，正在创建...
    (
        echo # AI API 配置（必填）
        echo AI_API_BASE_URL=https://copilot.huya.info/api/anthropic/
        echo AI_API_KEY=sk-你的key填在这里
        echo AI_MODEL=claude-sonnet-4-20250514
        echo.
        echo # ffmpeg 路径（Windows 请填写完整路径，如 C:\ffmpeg\bin\ffmpeg.exe）
        echo # 如果已加入系统 PATH，可保持默认值 ffmpeg
        echo FFMPEG_PATH=ffmpeg
        echo FFPROBE_PATH=ffprobe
    ) > .env.local
    echo [提示] 已创建 .env.local，请编辑填入你的 AI_API_KEY
    echo [提示] 文件位置：%~dp0.env.local
    echo.
    start notepad .env.local
    echo 填写完成后，请重新运行此脚本
    pause
    exit /b 0
)

echo [启动] 正在启动 ScriptX...
echo [启动] 访问地址：http://localhost:3000
echo [启动] 按 Ctrl+C 停止
echo.

call npm run dev
