@echo off
echo ========================================
echo Deploying GetOn to Vercel
echo ========================================
echo.

cd /d "%~dp0"

echo Building production bundle...
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo.
echo Opening Vercel Dashboard...
echo.
echo MANUAL DEPLOYMENT STEPS:
echo 1. Go to: https://vercel.com/new
echo 2. Click "Browse" and select the 'dist' folder
echo 3. Project name: get-on
echo 4. Framework: Vite
echo 5. Click "Deploy"
echo.
echo Opening browser now...
start https://vercel.com/new

echo.
echo Your 'dist' folder is at:
echo %CD%\dist
echo.
pause
