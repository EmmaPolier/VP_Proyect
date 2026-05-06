#!/usr/bin/env pwsh

# VP Project - Quick Start (sin setup)
# Levanta Backend y Frontend en modo desarrollo

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "VP PROJECT - Starting Servers" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

Write-Host "`nVerificando dependencias..." -ForegroundColor Yellow

if (-not (Test-Path "$PSScriptRoot\backend\node_modules")) {
    Write-Host "WARNING: Backend dependencies no están instaladas" -ForegroundColor Yellow
    Write-Host "Ejecutando: npm install en backend..." -ForegroundColor Yellow
    Set-Location "$PSScriptRoot\backend"
    npm install
}

if (-not (Test-Path "$PSScriptRoot\frontend\node_modules")) {
    Write-Host "WARNING: Frontend dependencies no están instaladas" -ForegroundColor Yellow
    Write-Host "Ejecutando: npm install en frontend..." -ForegroundColor Yellow
    Set-Location "$PSScriptRoot\frontend"
    npm install
}

Write-Host "`n[1/2] Iniciando Backend en puerto 4000..." -ForegroundColor Cyan
$backendJob = Start-Job -ScriptBlock {
    Set-Location "$using:PSScriptRoot\backend"
    Write-Host "Backend iniciándose..." -ForegroundColor Green
    npm run dev
} -Name "VP-Backend"

Write-Host "Backend iniciado (Job ID: $($backendJob.Id))" -ForegroundColor Green

Start-Sleep -Seconds 2

Write-Host "`n[2/2] Iniciando Frontend en puerto 3000..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SERVIDORES LEVANTADOS" -ForegroundColor Green
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

Set-Location "$PSScriptRoot\frontend"
npm run dev
