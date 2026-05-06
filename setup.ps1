#!/usr/bin/env pwsh

# VP Project - Local Setup Script
# Este script configura el proyecto para desarrollo local

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "VP PROJECT - Local Setup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Verificar si Node.js está instalado
Write-Host "`n[1/4] Verificando Node.js..." -ForegroundColor Yellow
$node = node --version
Write-Host "✓ Node.js $node instalado" -ForegroundColor Green

# Verificar si PostgreSQL está disponible
Write-Host "`n[2/4] Verificando PostgreSQL..." -ForegroundColor Yellow
try {
    $psql = psql --version
    Write-Host "✓ PostgreSQL disponible: $psql" -ForegroundColor Green
} catch {
    Write-Host "✗ PostgreSQL no encontrado. Por favor instálalo desde https://www.postgresql.org/download/windows/" -ForegroundColor Red
    exit 1
}

# Instalar dependencias Backend
Write-Host "`n[3/4] Instalando dependencias del Backend..." -ForegroundColor Yellow
cd "$PSScriptRoot\backend"
npm install
Write-Host "✓ Backend dependencies instaladas" -ForegroundColor Green

# Instalar dependencias Frontend
Write-Host "`n[4/4] Instalando dependencias del Frontend..." -ForegroundColor Yellow
cd "$PSScriptRoot\frontend"
npm install
Write-Host "✓ Frontend dependencies instaladas" -ForegroundColor Green

Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "✓ Setup completado!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan

Write-Host "`nSiguientes pasos:
1. Crear BD en PostgreSQL (ver SETUP_LOCAL.md)
2. Backend:   cd backend && npm run dev
3. Frontend:  cd frontend && npm run dev
4. Abrir:     http://localhost:3000" -ForegroundColor Cyan

Write-Host "`n📖 Lee SETUP_LOCAL.md para instrucciones detalladas`n" -ForegroundColor Green
