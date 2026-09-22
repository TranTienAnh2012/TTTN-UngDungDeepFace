@echo off
chcp 65001 >nul
title Python AI Service [Port 8000]
color 0B
cd /d "%~dp0"
echo ===================================================
echo           PYTHON AI SERVICE (PORT 8000)
echo ===================================================
echo.
if exist "venv\Scripts\python.exe" (
    echo [*] Dang chay bang moi truong Python venv (venv)...
    "venv\Scripts\python.exe" main.py
) else if exist "..\.venv\Scripts\python.exe" (
    echo [*] Dang chay bang moi truong Python venv (..\.venv)...
    "..\.venv\Scripts\python.exe" main.py
) else (
    echo [*] Dang chay bang Python he thong...
    python main.py
)
if %errorlevel% neq 0 (
    echo.
    echo [X] Python AI Service da dung lai voi ma loi: %errorlevel%
    pause
)
