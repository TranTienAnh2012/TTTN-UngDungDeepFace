@echo off
chcp 65001 >nul
title Backend Node.js [Port 5000]
color 0A
cd /d "%~dp0"
echo ===================================================
echo             BACKEND NODE.JS (PORT 5000)
echo ===================================================
echo.
if not exist node_modules (
    echo [*] Dang cai dat thu vien cho Backend...
    call npm install
)
call npm start
if %errorlevel% neq 0 (
    echo.
    echo [X] Backend Node.js da dung lai voi ma loi: %errorlevel%
    pause
)
