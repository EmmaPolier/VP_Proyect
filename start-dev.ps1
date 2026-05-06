#!/usr/bin/env pwsh

# VP Project - Quick Start (sin setup)
# Levanta Backend y Frontend en modo desarrollo

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "VP PROJECT - Starting Servers" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

Write-Host "`nVerificando dependencias..." -ForegroundColor Yellow

# Verificar que node_modules existen
if (-not (Test-Path "$PSScriptRoot\backend\node_modules")) {
    Write-Host "⚠️  Backend dependencies no están instaladas" -ForegroundColor Yellow
    Write-Host "Ejecutando: npm install en backend..." -ForegroundColor Yellow
    cd "$PSScriptRoot\backend"
    npm install
}

if (-not (Test-Path "$PSScriptRoot\frontend\node_modules")) {
    Write-Host "⚠️  Frontend dependencies no están instaladas" -ForegroundColor Yellow
    Write-Host "Ejecutando: npm install en frontend..." -ForegroundColor Yellow
    cd "$PSScriptRoot\frontend"
    npm install
}

# Iniciar Backend en background
Write-Host "`n[1/2] Iniciando Backend en puerto 4000..." -ForegroundColor Cyan
$backendJob = Start-Job -ScriptBlock {
    cd "$using:PSScriptRoot\backend"
    Write-Host "Backend iniciándose..." -ForegroundColor Green
    npm run dev
} -Name "VP-Backend"

Write-Host "✓ Backend iniciado (Job ID: $($backendJob.Id))" -ForegroundColor Green

# Esperar un poco para que inicie
Start-Sleep -Seconds 2

# Iniciar Frontend (foreground)
Write-Host "`n[2/2] Iniciando Frontend en puerto 3000..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 SERVIDORES LEVANTADOS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Yellow
Write-Host "Backend:  http://localhost:4000" -ForegroundColor Yellow
Write-Host "API Test: http://localhost:4000/test" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nPara ver logs del Backend, ejecuta:" -ForegroundColor Cyan
Write-Host "Get-Job -Name VP-Backend | Receive-Job -Keep" -ForegroundColor White
Write-Host "`nPara detener, ejecuta:" -ForegroundColor Cyan
Write-Host "Stop-Job -Name VP-Backend; Remove-Job -Name VP-Backend" -ForegroundColor White
Write-Host "`n========================================`n" -ForegroundColor Cyan

cd "$PSScriptRoot\frontend"
npm run dev
