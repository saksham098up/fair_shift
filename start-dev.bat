@echo off
setlocal
echo ===================================================
echo Starting FairShift Development Server (Vite)...
echo ===================================================
cd /d "%~dp0"
set "PATH=%~dp0.tools\node-v20.18.0-win-x64;%PATH%"
echo Using Portable Node.js:
node -v
echo.
echo Starting Backend API and Vite Frontend...
echo App will be available at: http://localhost:3000
echo.
start "FairShift Backend API" cmd /k "node server/server.js"
npm run dev
pause
