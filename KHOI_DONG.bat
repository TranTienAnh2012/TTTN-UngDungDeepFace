@echo off
chcp 65001 >nul
title KHOI DONG HE THONG DIEM DANH KHUON MAT
color 0F

echo ===============================================================================
echo        HE THONG DIEM DANH & QUAN LY THI BANG NHAN DIEN KHUON MAT
echo                          (University Face System)
echo ===============================================================================
echo.

set "BASE_DIR=%~dp0"
if exist "%BASE_DIR%University-face-system" (
    set "PROJ_DIR=%BASE_DIR%University-face-system"
) else (
    set "PROJ_DIR=%BASE_DIR%"
)

:: 1. Kiem tra Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [X] LOI: May tinh chua cai dat Node.js!
    echo Vui long tai va cai dat tai: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 2. Kiem tra Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    if not exist "%PROJ_DIR%\python-ai-service\venv\Scripts\python.exe" (
        echo [X] LOI: May tinh chua cai dat Python va chua co moi truong venv!
        echo Vui long cai dat Python 3.10+ hoac chay script tao venv.
        echo.
        pause
        exit /b 1
    )
)

:: 3. Kiem tra dependencies backend & frontend
if not exist "%PROJ_DIR%\backend-nodejs\node_modules" (
    echo [*] Dang cai dat thu vien cho Backend Node.js...
    cd /d "%PROJ_DIR%\backend-nodejs"
    call npm install
)

if not exist "%PROJ_DIR%\frontend-react\node_modules" (
    echo [*] Dang cai dat thu vien cho Frontend React...
    cd /d "%PROJ_DIR%\frontend-react"
    call npm install
)

:: 4. Kiem tra & Khoi tao Database MySQL
echo [*] Dang kiem tra ket noi Database MySQL va khoi tao schema...
cd /d "%PROJ_DIR%\backend-nodejs"
call node init_db.js
if %errorlevel% neq 0 (
    echo.
    echo ===============================================================================
    echo [X] LOI KET NOI DATABASE MYSQL!
    echo - Hay chac chan MySQL (XAMPP / Laragon / Docker) dang duoc BAT o cong 3306.
    echo - Kiem tra user/password trong file .env (Mac dinh: user=root, password=123456).
    echo ===============================================================================
    echo.
    pause
    exit /b 1
)

echo.
echo ===============================================================================
echo [+] DATABASE SAN SANG! DANG KHOI DONG 3 DICH VU...
echo ===============================================================================
echo.

:: 5. Khoi dong 3 dich vu trong 3 cua so rieng biet
echo [1/3] Khoi dong Python AI Service (Port 8000)...
start "1. Python AI Service [Port 8000]" cmd /k "cd /d "%PROJ_DIR%\python-ai-service" && title Python AI Service [Port 8000] && color 0B && if exist venv\Scripts\activate.bat (call venv\Scripts\activate.bat) && python main.py"

echo [2/3] Khoi dong Backend Node.js (Port 5000)...
start "2. Backend Node.js [Port 5000]" cmd /k "cd /d "%PROJ_DIR%\backend-nodejs" && title Backend Node.js [Port 5000] && color 0A && npm start"

echo [3/3] Khoi dong Frontend React (Port 5173)...
start "3. Frontend React [Port 5173]" cmd /k "cd /d "%PROJ_DIR%\frontend-react" && title Frontend React [Port 5173] && color 0E && npm run dev"

echo.
echo [*] Dang cho cac dich vu san sang (3 giay)...
timeout /t 3 /nobreak >nul

:: 6. Tu dong mo trinh duyet
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
echo  (Giu cua so nay hoac dong lai. De tat tat ca dich vu, chay file STOP_ALL.bat)
echo ===============================================================================
echo.
pause
