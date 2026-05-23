@echo off

cd /d "%~dp0"

echo ============================================

echo  Configuration Supabase - Assistant GI

echo ============================================

echo.

echo Ouverture du dashboard (cles API + Auth)...

start "" "https://supabase.com/dashboard/project/gncrhhwiysqianavmpha/settings/api"

timeout /t 2 >nul

start "" "https://supabase.com/dashboard/project/gncrhhwiysqianavmpha/auth/providers"

echo.

echo Copiez la cle ANON (public) depuis Settings - API

echo.

set /p ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduY3JoaHdpeXNxaWFuYXZtcGhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NTIzODQsImV4cCI6MjA5NTAyODM4NH0.DGFPRMCwMOw24bAc1-iDXUwpoabLo6KEMbuty-A4OUo"

if "%ANON_KEY%"=="" (

  echo ERREUR: cle vide.

  pause

  exit /b 1

)

"%~dp0venv\Scripts\python.exe" scripts\set_anon_key.py "%ANON_KEY%"

"%~dp0venv\Scripts\python.exe" scripts\complete_supabase_setup.py

echo.

echo Activez "Confirm email" dans Auth - Providers si pas deja fait.

pause

