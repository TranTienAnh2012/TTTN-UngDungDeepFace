@echo off
chcp 65001 >nul
title Frontend React [Port 5173]
color 0E
cd /d "%~dp0"
echo ===================================================
echo             FRONTEND REACT (PORT 5173)
echo ===================================================
echo.
if not exist node_modules (
    echo [*] Dang cai dat thu vien cho Frontend...
    call npm install
)
call npm run dev
if %errorlevel% neq 0 (
    echo.
    echo [X] Frontend React da dung lai voi ma loi: %errorlevel%
    pause
)
