# Government Monitoring Platform Startup Bootstrapper

Write-Host "🏛️ Starting Government Monitoring and Transparency Platform..." -ForegroundColor Blue

# 1. Start Database
Write-Host "💾 Starting MongoDB Docker Container..." -ForegroundColor Yellow
docker-compose up -d

# 2. Start Python Backend Microservices in separate windows
Write-Host "🐍 Bootstrapping 8 Microservices..." -ForegroundColor Yellow

$services = @(
    @{ name="Auth Service"; port=8001; path="services/auth-service" },
    @{ name="Project Service"; port=8002; path="services/project-service" },
    @{ name="Feedback Service"; port=8003; path="services/feedback-service" },
    @{ name="Document Service"; port=8004; path="services/document-service" },
    @{ name="Analytics Service"; port=8005; path="services/analytics-service" },
    @{ name="Notification Service"; port=8006; path="services/notification-service" },
    @{ name="Audit Service"; port=8007; path="services/audit-service" },
    @{ name="AI Prediction Service"; port=8008; path="services/prediction-service" }
)

foreach ($srv in $services) {
    Write-Host "🚀 Launching $($srv.name) on port $($srv.port)..." -ForegroundColor Cyan
    # Start-Process will open a new CMD window for each service
    Start-Process cmd -ArgumentList "/k title $($srv.name) (Port $($srv.port)) && cd $($srv.path) && ..\..\.venv\Scripts\python.exe -m uvicorn app.main:app --port $($srv.port) --reload"
}

# 3. Start Frontend Dev Server
Write-Host "🌐 Launching React Vite Frontend..." -ForegroundColor Yellow
Start-Process cmd -ArgumentList "/k title React Frontend && cd frontend && npm run dev"

Write-Host "✨ All services launched! Check the new terminal windows for log output." -ForegroundColor Green
Write-Host "🔗 Frontend is running at http://localhost:5173" -ForegroundColor Green
