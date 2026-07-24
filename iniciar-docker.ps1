$ErrorActionPreference = "Stop"

Write-Host "Verificando Docker Desktop..." -ForegroundColor Cyan

docker info *> $null

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Docker Desktop no esta ejecutandose." -ForegroundColor Red
    Write-Host "Abre Docker Desktop, espera a que diga Engine running y vuelve a ejecutar este archivo."
    exit 1
}

if (-not (Test-Path ".env")) {
    Write-Host "Falta el archivo .env del backend." -ForegroundColor Red
    Write-Host "Debe contener SECRET_KEY, DEBUG y DATABASE_URL de Supabase."
    exit 1
}

if (-not (Test-Path ".env.docker")) {
    Copy-Item ".env.docker.example" ".env.docker"
    Write-Host ""
    Write-Host "Se creo .env.docker." -ForegroundColor Yellow
    Write-Host "Abre ese archivo, corrige FRONTEND_PATH y vuelve a ejecutar."
    exit 1
}

Write-Host "Construyendo y ejecutando el proyecto..." -ForegroundColor Green
docker compose --env-file .env.docker up --build
