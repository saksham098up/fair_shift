@echo off
setlocal
echo ===================================================
echo Starting FairShift Full-Stack Server on Port 8080...
echo ===================================================
cd /d "%~dp0"
set "PATH=%~dp0.tools\node-v20.18.0-win-x64;%PATH%"
echo Using Portable Node.js:
node -v
echo.
echo App URL: http://localhost:8080
echo Press Ctrl+C to stop the server anytime.
echo.
node server/server.js
pause
