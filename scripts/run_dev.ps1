# AetherGIS — PowerShell Dev Helper

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "`n=== AetherGIS — Starting Development Environment ===" -ForegroundColor Cyan

# Check Docker / Redis
$dockerRunning = docker ps --format "{{.Names}}" 2>$null | Select-String "AetherGIS_redis"
if (-not $dockerRunning) {
    Write-Host "Starting Redis via Docker..." -ForegroundColor Yellow
    docker compose -f "$Root\docker-compose.yml" up redis -d
    Start-Sleep -Seconds 3
}

# Start backend
Write-Host "`nStarting FastAPI backend (port 8000)..." -ForegroundColor Green
$backend = Start-Process pwsh -ArgumentList "-NoExit", "-Command", `
    "cd '$Root'; uv run uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000" `
    -PassThru

# Start Celery worker  
Write-Host "Starting Celery worker..." -ForegroundColor Green
$worker = Start-Process pwsh -ArgumentList "-NoExit", "-Command", `
    "cd '$Root'; uv run celery -A backend.app.tasks.celery_app.celery_app worker --loglevel=info -P solo" `
    -PassThru

# Start frontend
Write-Host "Starting Vite frontend (port 5173)..." -ForegroundColor Green
$frontend = Start-Process pwsh -ArgumentList "-NoExit", "-Command", `
    "cd '$Root\frontend'; npm run dev" `
    -PassThru

Write-Host "`n✅ AetherGIS is starting up!" -ForegroundColor Green
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "   API Docs:  http://localhost:8000/api/docs" -ForegroundColor Cyan
Write-Host "`nPress Ctrl+C to stop all processes." -ForegroundColor Yellow

try { while ($true) { Start-Sleep -Seconds 5 } }
finally {
    Stop-Process -Id $backend.Id, $worker.Id, $frontend.Id -ErrorAction SilentlyContinue
    Write-Host "All processes stopped." -ForegroundColor Yellow
}
