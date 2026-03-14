@echo off
echo Starting Data Cura...

:: Start AI Backend
start "AI Cleaning API - Port 8001" cmd /k "cd /d "%~dp0AiModule" && python app.py"

:: Wait a moment then start Frontend
timeout /t 2 /nobreak > nul
start "React UI - Port 5173" cmd /k "cd /d "%~dp0FrontEnd" && npm run dev"

:: Open browser after servers are up
timeout /t 4 /nobreak > nul
start http://localhost:5173

echo Both servers are starting...
echo  - AI API:  http://localhost:8001
echo  - React:   http://localhost:5173
