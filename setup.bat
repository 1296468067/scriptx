@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

echo.
echo  ========================================
echo   ScriptX - 环境自动配置
echo  ========================================
echo.

set "TOOLS_DIR=%~dp0tools"
set "NODE_DIR=%TOOLS_DIR%\node"
set "FFMPEG_DIR=%TOOLS_DIR%\ffmpeg"
set "DONE_MARKER=%TOOLS_DIR%\.setup_done"

:: 如果已完成配置，跳过
if exist "%DONE_MARKER%" (
    echo [完成] 环境已配置，跳过安装
    goto :check_env
)

:: 创建 tools 目录
if not exist "%TOOLS_DIR%" mkdir "%TOOLS_DIR%"

:: ===== 安装 Node.js =====
where node >nul 2>&1
if %errorlevel% equ 0 (
    echo [跳过] 系统已安装 Node.js
    for /f "tokens=*" %%i in ('node -v') do echo        版本: %%i
) else (
    if exist "%NODE_DIR%\node.exe" (
        echo [跳过] Node.js 已下载
    ) else (
        echo [下载] 正在下载 Node.js（约30MB）...
        set "NODE_URL=https://nodejs.org/dist/v20.18.1/node-v20.18.1-win-x64.zip"
        powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%NODE_URL%' -OutFile '%TOOLS_DIR%\node.zip'"
        if !errorlevel! neq 0 (
            echo [错误] 下载 Node.js 失败
            echo [提示] 请手动下载: https://nodejs.org/
            pause
            exit /b 1
        )
        echo [解压] 正在解压 Node.js ...
        powershell -Command "Expand-Archive -Path '%TOOLS_DIR%\node.zip' -DestinationPath '%TOOLS_DIR%\node_tmp' -Force"
        for /d %%d in ("%TOOLS_DIR%\node_tmp\node-*") do move "%%d\*" "%NODE_DIR%\" >nul 2>&1
        if not exist "%NODE_DIR%" (
            move "%TOOLS_DIR%\node_tmp\*" "%NODE_DIR%\" >nul 2>&1
        )
        rmdir /s /q "%TOOLS_DIR%\node_tmp" 2>nul
        del "%TOOLS_DIR%\node.zip" 2>nul
        echo [完成] Node.js 安装完成
    )
    set "PATH=%NODE_DIR%;%PATH%"
)

:: ===== 安装 ffmpeg =====
where ffmpeg >nul 2>&1
if %errorlevel% equ 0 (
    echo [跳过] 系统已安装 ffmpeg
) else (
    if exist "%FFMPEG_DIR%\bin\ffmpeg.exe" (
        echo [跳过] ffmpeg 已下载
    ) else (
        echo [下载] 正在下载 ffmpeg（约80MB）...
        set "FFMPEG_URL=https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
        powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%FFMPEG_URL%' -OutFile '%TOOLS_DIR%\ffmpeg.zip'"
        if !errorlevel! neq 0 (
            echo [警告] ffmpeg 下载失败，视频处理功能将不可用
            echo [提示] 可手动下载: https://www.gyan.dev/ffmpeg/builds/
        ) else (
            echo [解压] 正在解压 ffmpeg ...
            powershell -Command "Expand-Archive -Path '%TOOLS_DIR%\ffmpeg.zip' -DestinationPath '%TOOLS_DIR%\ffmpeg_tmp' -Force"
            for /d %%d in ("%TOOLS_DIR%\ffmpeg_tmp\ffmpeg-*") do move "%%d" "%FFMPEG_DIR%" >nul 2>&1
            rmdir /s /q "%TOOLS_DIR%\ffmpeg_tmp" 2>nul
            del "%TOOLS_DIR%\ffmpeg.zip" 2>nul
            echo [完成] ffmpeg 安装完成
        )
    )
    if exist "%FFMPEG_DIR%\bin\ffmpeg.exe" (
        set "PATH=%FFMPEG_DIR%\bin;%PATH%"
    )
)

:: ===== 安装 npm 依赖 =====
echo.
echo [安装] 正在安装项目依赖...
cd /d "%~dp0"
call npm install
if %errorlevel% neq 0 (
    echo [错误] npm install 失败
    pause
    exit /b 1
)
echo [完成] 依赖安装完成

:: 标记完成
echo done > "%DONE_MARKER%"

:check_env
:: ===== 检查 .env.local =====
if not exist "%~dp0.env.local" (
    echo.
    echo [配置] 正在创建配置文件...
    (
        echo # AI API 配置（必填）
        echo AI_API_BASE_URL=https://copilot.huya.info/api/anthropic/
        echo AI_API_KEY=sk-你的key填在这里
        echo AI_MODEL=claude-sonnet-4-20250514
    ) > "%~dp0.env.local"
    echo [提示] 已创建 .env.local，请编辑填入你的 AI_API_KEY
    start notepad "%~dp0.env.local"
    echo [提示] 填写完成后重新运行 start.bat
    pause
    exit /b 0
)

echo.
echo [完成] 环境配置完成！
echo.
