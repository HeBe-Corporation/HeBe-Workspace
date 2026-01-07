@echo off
cd /d "%~dp0"
echo === Oliveyoung Analyzer ===
echo.
call npm run build
echo.
call node_modules\.bin\electron.cmd .
echo.
pause
