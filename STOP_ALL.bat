@echo off
chcp 65001 >nul
title TAT TOAN BO DICH VU
color 0C

echo ===============================================================================
echo                DANG TAT CAC DICH VU (PORTS: 8000, 5000, 5173)
echo ===============================================================================
echo.

powershell -Command "Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -match 'Port 8000|Port 5000|Port 5173|Python AI Service|Backend Node.js|Frontend React' } | Stop-Process -Force"

powershell -Command "Get-NetTCPConnection -LocalPort 8000,5000,5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }"

echo [+] Da tat tat ca cac dich vu thanh cong!
echo.
pause
