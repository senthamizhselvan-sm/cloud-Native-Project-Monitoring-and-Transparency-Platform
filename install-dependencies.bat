@echo off
echo 🏛️ Installing Backend Python Dependencies...
echo.

rem Check if .venv exists
if not exist ".venv" (
    echo ❌ Local virtual environment .venv not found in root.
    echo Please create it first by running: python -m venv .venv
    pause
    exit /b 1
)

echo 🐍 Installing requirements for all 8 microservices into .venv...

echo.
echo [1/8] Installing Auth Service dependencies...
.venv\Scripts\pip install -r services\auth-service\requirements.txt

echo.
echo [2/8] Installing Project Service dependencies...
.venv\Scripts\pip install -r services\project-service\requirements.txt

echo.
echo [3/8] Installing Feedback Service dependencies...
.venv\Scripts\pip install -r services\feedback-service\requirements.txt

echo.
echo [4/8] Installing Document Service dependencies...
.venv\Scripts\pip install -r services\document-service\requirements.txt

echo.
echo [5/8] Installing Analytics Service dependencies...
.venv\Scripts\pip install -r services\analytics-service\requirements.txt

echo.
echo [6/8] Installing Notification Service dependencies...
.venv\Scripts\pip install -r services\notification-service\requirements.txt

echo.
echo [7/8] Installing Audit Service dependencies...
.venv\Scripts\pip install -r services\audit-service\requirements.txt

echo.
echo [8/8] Installing AI Prediction Service dependencies...
.venv\Scripts\pip install -r services\prediction-service\requirements.txt

echo.
echo ✨ All dependencies successfully installed inside the local virtual environment (.venv)!
echo.
pause
