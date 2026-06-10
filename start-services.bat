@echo off
echo 🏛️ Starting Government Monitoring and Transparency Platform...

echo 💾 Starting MongoDB Docker Container...
docker-compose up -d

echo 🐍 Bootstrapping 8 Microservices...
start "Auth Service (Port 8001)" cmd /k "cd services\auth-service && ..\..\.venv\Scripts\python.exe -m uvicorn app.main:app --port 8001 --reload"
start "Project Service (Port 8002)" cmd /k "cd services\project-service && ..\..\.venv\Scripts\python.exe -m uvicorn app.main:app --port 8002 --reload"
start "Feedback Service (Port 8003)" cmd /k "cd services\feedback-service && ..\..\.venv\Scripts\python.exe -m uvicorn app.main:app --port 8003 --reload"
start "Document Service (Port 8004)" cmd /k "cd services\document-service && ..\..\.venv\Scripts\python.exe -m uvicorn app.main:app --port 8004 --reload"
start "Analytics Service (Port 8005)" cmd /k "cd services\analytics-service && ..\..\.venv\Scripts\python.exe -m uvicorn app.main:app --port 8005 --reload"
start "Notification Service (Port 8006)" cmd /k "cd services\notification-service && ..\..\.venv\Scripts\python.exe -m uvicorn app.main:app --port 8006 --reload"
start "Audit Service (Port 8007)" cmd /k "cd services\audit-service && ..\..\.venv\Scripts\python.exe -m uvicorn app.main:app --port 8007 --reload"
start "AI Prediction Service (Port 8008)" cmd /k "cd services\prediction-service && ..\..\.venv\Scripts\python.exe -m uvicorn app.main:app --port 8008 --reload"

echo 🌐 Launching React Vite Frontend...
start "React Frontend" cmd /k "cd frontend && npm run dev"

echo ✨ All services launched!
echo 🔗 Frontend is running at http://localhost:5173
