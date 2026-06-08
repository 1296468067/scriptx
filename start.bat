@echo off
chcp 65001 >nul 2>&1
title ScriptX

echo.
echo  ╔══════════════════════════════════════╗
echo  ║   ScriptX - 爆款脚本拆解 × 即梦提示词  ║
echo  ╚══════════════════════════════════════╝
echo.

cd /d "%~dp0"

:: 首次运行：自动配置环境
call setup.bat
if %errorlevel% neq 0 exit /b 1

:: 设置 tools 路径
if exist "tools\node" set "PATH=%~dp0tools\node;%PATH%"
if exist "tools\ffmpeg\bin" set "PATH=%~dp0tools\ffmpeg\bin;%PATH%"

echo [启动] 正在启动 ScriptX...
echo [启动] 访问地址：http://localhost:3000
echo [启动] 按 Ctrl+C 停止
echo.

call npm run dev
