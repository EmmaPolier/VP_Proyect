# Script para iniciar Backend y Frontend en paralelo
# Ejecutar desde la raíz del proyecto

Write-Host "🚀 Iniciando VP_Proyect (Backend + Frontend)" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

# Verificar que nos estamos en la raíz del proyecto
if (!(Test-Path "backend") -or !(Test-Path "frontend")) {
    Write-Host "❌ Error: Debes ejecutar este script desde la raíz del proyecto" -ForegroundColor Red
    Write-Host "   Ubicación actual: $PWD" -ForegroundColor Yellow
    exit 1
}

# Iniciar Backend en nueva terminal
Write-Host "`n📂 Terminal 1: Iniciando BACKEND..." -ForegroundColor Cyan
$backendCommand = "cd '$(Get-Location)\backend' ; npm run dev ; Read-Host 'Presiona Enter para cerrar'"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCommand -WindowStyle Normal

# Esperar un poco para evitar conflictos
Start-Sleep -Seconds 2

# Iniciar Frontend en nueva terminal
Write-Host "📂 Terminal 2: Iniciando FRONTEND..." -ForegroundColor Cyan
$frontendCommand = "cd '$(Get-Location)\frontend' ; npm run dev ; Read-Host 'Presiona Enter para cerrar'"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCommand -WindowStyle Normal

Write-Host "`n✅ Ambos servidores iniciados" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "`n🌐 Accede a:" -ForegroundColor Green
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Backend:  http://localhost:4000" -ForegroundColor White
Write-Host "`n💡 Para detener los servidores, cierra las terminales" -ForegroundColor Yellow
Write-Host "   O presiona Ctrl+C en cada terminal" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
