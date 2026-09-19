@echo off
chcp 65001 >nul
title HE THONG DIEM DANH KHUON MAT - KHOI DONG
color 0F

echo ===============================================================================
echo        HE THONG DIEM DANH VA QUAN LY THI BANG NHAN DIEN KHUON MAT
echo                          (University Face System)
echo ===============================================================================
echo.

set "BASE_DIR=%~dp0"
if exist "%BASE_DIR%University-face-system" (
    set "PROJ_DIR=%BASE_DIR%University-face-system"
) else (
    set "PROJ_DIR=%BASE_DIR%"
)

REM 1. Kiem tra Node.js
where node >nul 2>nul
if %errorlevel% neq 0 goto :node_missing

REM 2. Kiem tra va khoi tao Database MySQL
echo [*] Dang kiem tra ket noi Database MySQL va khoi tao du lieu...
cd /d "%PROJ_DIR%\backend-nodejs"
call node init_db.js
if %errorlevel% neq 0 goto :db_error

echo.
echo ===============================================================================
echo [+] DATABASE SAN SANG - DANG KHOI DONG CAC DICH VU...
echo ===============================================================================
echo.

REM 3. Bat 3 dich vu bang start
echo [1/3] Khoi dong Python AI Service [Port 8000]...
start "1. Python AI Service [Port 8000]" cmd /k "%PROJ_DIR%\python-ai-service\start_ai.bat"

echo [2/3] Khoi dong Backend Node.js [Port 5000]...
start "2. Backend Node.js [Port 5000]" cmd /k "%PROJ_DIR%\backend-nodejs\start_backend.bat"

echo [3/3] Khoi dong Frontend React [Port 5173]...
start "3. Frontend React [Port 5173]" cmd /k "%PROJ_DIR%\frontend-react\start_frontend.bat"

echo.
echo [*] Dang cho cac dich vu san sang trong 3 giay...
ping 127.0.0.1 -n 4 >nul

REM 4. Mo trinh duyet
start http://localhost:5173

echo.
echo ===============================================================================
echo                  HE THONG DA KHOI DONG THANH CONG!
echo ===============================================================================
echo  - Web Application:     http://localhost:5173
echo  - Backend API:         http://localhost:5000
echo  - Python AI Service:   http://localhost:8000
echo -------------------------------------------------------------------------------
echo  - Tai khoan Admin:     admin@system.com
echo  - Mat khau Admin:      admin
echo ===============================================================================
echo  (Giu nguyen cac cua so dich vu. De tat tat ca, hay chay file STOP_ALL.bat)
echo ===============================================================================
echo.
pause
exit /b 0

:node_missing
echo.
echo ===============================================================================
echo [X] LOI: May tinh chua cai dat Node.js!
echo Vui long tai va cai dat Node.js tai: https://nodejs.org/
echo ===============================================================================
echo.
pause
exit /b 1

:db_error
echo.
echo ===============================================================================
echo [X] LOI KET NOI DATABASE MYSQL!
echo - Hay chac chan MySQL ^(XAMPP / Laragon / MySQL Service^) dang duoc BAT o cong 3309 ^(hoac 3306^).
echo - Kiem tra user va password trong file .env ^(Kiem tra DB_PORT=3309 va DB_PASSWORD=^).
echo ===============================================================================
echo.
pause
exit /b 1
