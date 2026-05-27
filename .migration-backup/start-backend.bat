@echo off

cd /d "%~dp0"

echo Backend : http://127.0.0.1:8000  |  Docs : http://127.0.0.1:8000/docs

echo (Utilise le Python du venv, sans Activate.ps1)

"%~dp0venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

if errorlevel 1 (

  echo.

  echo ERREUR: le port 8000 est peut-etre deja utilise.

  echo Fermez l autre terminal backend ou executez: taskkill /F /PID ^<pid^>

  echo Pour trouver le PID: netstat -ano ^| findstr :8000

)

pause

