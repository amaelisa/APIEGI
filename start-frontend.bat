@echo off
cd /d "%~dp0frontend"
set "PATH=C:\Program Files\nodejs;%PATH%"
where npm >nul 2>&1
if errorlevel 1 (
  echo ERREUR: npm introuvable. Verifiez que Node.js est installe depuis https://nodejs.org
  pause
  exit /b 1
)
if not exist node_modules (
  echo Installation des dependances npm...
  call npm install
  if errorlevel 1 (
    echo Echec npm install. Fermez OneDrive ou deplacez le projet hors de OneDrive si le probleme persiste.
    pause
    exit /b 1
  )
)
echo Demarrage du frontend sur http://localhost:5173
call npm run dev
pause
