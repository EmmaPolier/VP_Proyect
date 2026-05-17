# Script para instalar dependencias del proyecto
# Ejecutar desde la raíz del proyecto

Write-Host "🚀 Instalando dependencias del proyecto VP_Proyect..." -ForegroundColor Green

Write-Host "`n📦 Backend - Instalando dependencias..." -ForegroundColor Cyan
cd backend
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backend instalado correctamente" -ForegroundColor Green
} else {
    Write-Host "❌ Error al instalar backend" -ForegroundColor Red
    exit 1
}
cd ..

Write-Host "`n📦 Frontend - Instalando dependencias..." -ForegroundColor Cyan
cd frontend
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Frontend instalado correctamente" -ForegroundColor Green
} else {
    Write-Host "❌ Error al instalar frontend" -ForegroundColor Red
    exit 1
}
cd ..

Write-Host "`n✨ Generando cliente Prisma..." -ForegroundColor Cyan
cd backend
npx prisma generate
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Prisma cliente generado" -ForegroundColor Green
} else {
    Write-Host "⚠️ Advertencia al generar Prisma (puede ser normal)" -ForegroundColor Yellow
}
cd ..

Write-Host "`n✅ INSTALACIÓN COMPLETADA" -ForegroundColor Green
Write-Host "`n📋 Próximos pasos:" -ForegroundColor Cyan
Write-Host "  1. cd backend && npx prisma migrate dev --name init" -ForegroundColor White
Write-Host "  2. .\start-dev.ps1" -ForegroundColor White
Write-Host "`n🌐 Accede a:" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  Backend:  http://localhost:4000" -ForegroundColor White
