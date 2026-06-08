@echo off
chcp 65001 >nul 2>&1
title ScriptX

echo.
echo  ========================================
echo   ScriptX - 爆款脚本拆解 x 即梦提示词
echo  ========================================
echo.

:: 切换到脚本所在目录
cd /d "%~dp0"
if %errorlevel% neq 0 (
    echo [错误] 无法切换到项目目录
    pause
    exit /b 1
)

:: 首次运行：自动配置环境
if not exist "tools\.setup_done" (
    call setup.bat
    if %errorlevel% neq 0 (
        echo [错误] 环境配置失败
        pause
        exit /b 1
    )
)

:: 设置 tools 路径
if exist "tools\node" set "PATH=%~dp0tools\node;%PATH%"
if exist "tools\ffmpeg\bin" set "PATH=%~dp0tools\ffmpeg\bin;%PATH%"

:: 检查 node
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js，请重新运行 setup.bat
    pause
    exit /b 1
)

:: 检查 .env.local
if not exist ".env.local" (
    echo [提示] 未检测到配置文件，正在创建...
    (
        echo # AI API 配置
        echo AI_API_BASE_URL=https://copilot.huya.info/api/anthropic/
        echo AI_API_KEY=sk-你的key填在这里
        echo AI_MODEL=claude-sonnet-4-20250514
    ) > .env.local
    echo [提示] 已创建 .env.local
    echo [提示] 请用记事本打开 .env.local 填入你的 AI_API_KEY
    echo [提示] 填写完成后重新双击 start.bat
    echo.
    start notepad .env.local
    pause
    exit /b 0
)

:: 检查 npm 依赖
if not exist "node_modules" (
    echo [安装] 正在安装依赖，请稍候...
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] npm install 失败
        pause
        exit /b 1
    )
    echo.
)

echo [启动] ScriptX 已启动
echo [启动] 访问地址: http://localhost:3000
echo [启动] 按 Ctrl+C 可停止
echo.

call npm run dev

:: 如果异常退出，暂停显示错误
echo.
echo [退出] ScriptX 已停止
pause
