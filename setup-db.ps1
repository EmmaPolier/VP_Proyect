#!/usr/bin/env pwsh

# VP Project - Database Setup Script
# Este script crea la BD y usuario en PostgreSQL

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "VP PROJECT - Database Setup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

Write-Host "`nEste script creará:" -ForegroundColor Yellow
Write-Host "  • Usuario: vp_user (contraseña: vp_password)"
Write-Host "  • Base de datos: vp_db"

# Pedir contraseña del usuario postgres
$postgres_password = Read-Host -Prompt "`nIngresa la contraseña del usuario 'postgres'" -AsSecureString
$postgres_pwd_plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToCoTaskMemUnicode($postgres_password))

# Conectar a PostgreSQL y ejecutar script SQL
Write-Host "`nCreando base de datos..." -ForegroundColor Yellow

$sqlScript = @"
CREATE USER vp_user WITH PASSWORD 'vp_password';
CREATE DATABASE vp_db OWNER vp_user;
GRANT ALL PRIVILEGES ON DATABASE vp_db TO vp_user;
"@

try {
    # Ejecutar SQL a través de psql
    $env:PGPASSWORD = $postgres_pwd_plain
    $sqlScript | psql -U postgres -h localhost
    $env:PGPASSWORD = ""
    
    Write-Host "✓ Base de datos creada exitosamente" -ForegroundColor Green
    
    # Verificar conexión
    Write-Host "`nVerificando conexión..." -ForegroundColor Yellow
    $env:PGPASSWORD = "vp_password"
    $result = psql -U vp_user -d vp_db -h localhost -c "SELECT 1;"
    $env:PGPASSWORD = ""
    
    if ($?) {
        Write-Host "✓ Conexión a vp_db verificada" -ForegroundColor Green
    }
    
} catch {
    Write-Host "✗ Error al crear la base de datos:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host "`n=====================================" -ForegroundColor Green
Write-Host "✓ Setup de BD completado!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

Write-Host "`nPróximo paso: Sincronizar con Prisma
Ejecuta: cd backend && npm run prisma:push`n" -ForegroundColor Cyan
