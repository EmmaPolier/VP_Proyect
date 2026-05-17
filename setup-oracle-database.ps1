# Script para conectar a Oracle XE
# Solo establece conexion, no ejecuta scripts

Write-Host ""
Write-Host "CONECTANDO A ORACLE XE" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "Credenciales:" -ForegroundColor Yellow
Write-Host "   Usuario: system" -ForegroundColor White
Write-Host "   Password: Emma2006" -ForegroundColor White
Write-Host "   SID: orcl" -ForegroundColor White

Write-Host ""
Write-Host "Abriendo SQL*Plus..." -ForegroundColor Cyan

# Conectar a Oracle XE con usuario system
sqlplus system/Emma2006@orcl

Write-Host ""
Write-Host "Desconectado de Oracle XE" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
