@echo off
echo Building PropertySwipe for production...
call npm run build
if errorlevel 1 (
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo Deploying to Vercel...
echo.
echo When prompted:
echo - Set up and deploy? Y
echo - Which scope? [your account]
echo - Link to existing project? N
echo - Project name? propertyswipe
echo - Directory? .
echo - Override settings? N
echo.
pause
vercel

echo.
echo Deployment complete!
pause
