#!/usr/bin/env pwsh

# VP Project - Full Setup & Start Script
# Este script hace setup completo y levanta los servidores

param(
    [switch]$SkipSetup = $false
)

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "VP PROJECT - Full Setup & Start" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Paso 1: Setup (opcional)
if (-not $SkipSetup) {
    Write-Host "`n[STEP 1] Ejecutando setup..." -ForegroundColor Yellow
    & "$PSScriptRoot\setup.ps1"
}

# Paso 2: Setup de BD (opcional)
$setupDb = Read-Host "`n¿Necesitas crear la BD en PostgreSQL? (s/n)"
if ($setupDb -eq 's') {
    Write-Host "`nEjecutando setup de BD..." -ForegroundColor Yellow
    & "$PSScriptRoot\setup-db.ps1"
}

# Paso 3: Sincronizar Prisma
Write-Host "`n[STEP 2] Sincronizando Prisma con BD..." -ForegroundColor Yellow
cd "$PSScriptRoot\backend"
npm run prisma:push

# Paso 4: Iniciar Backend
Write-Host "`n[STEP 3] Iniciando Backend en puerto 4000..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    cd "$using:PSScriptRoot\backend"
    npm run dev
}

# Paso 5: Iniciar Frontend
Write-Host "`n[STEP 4] Iniciando Frontend en puerto 3000..." -ForegroundColor Yellow
cd "$PSScriptRoot\frontend"
npm run dev

# Limpiar
Write-Host "`nDeteniendo servicios..." -ForegroundColor Yellow
Stop-Job -Job $backendJob
Remove-Job -Job $backendJob
