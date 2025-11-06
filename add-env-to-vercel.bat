@echo off
echo Adding Supabase environment variables to Vercel...
echo.

echo Adding VITE_SUPABASE_URL...
vercel env add VITE_SUPABASE_URL production

echo.
echo Adding VITE_SUPABASE_ANON_KEY...
vercel env add VITE_SUPABASE_ANON_KEY production

echo.
echo Environment variables added!
echo.
echo Now redeploy with: vercel --prod
pause
