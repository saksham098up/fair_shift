@echo off
setlocal
echo ===================================================
echo Deploying FairShift to Vercel...
echo ===================================================
cd /d "%~dp0"
set "PATH=%~dp0.tools\node-v20.18.0-win-x64;%PATH%"

echo Checking Vercel CLI...
call npx vercel login
echo.
echo Deploying to production on Vercel...
call npx vercel --prod
pause
