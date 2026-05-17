#!/usr/bin/env pwsh

# Script de pruebas para API Vamonos Pues
$baseUrl = "http://localhost:4000"

Write-Host "🧪 PRUEBAS DE ENDPOINTS - VAMONOS PUES" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Health Check
Write-Host "1️⃣  Health Check" -ForegroundColor Green
$health = Invoke-WebRequest -Uri "$baseUrl/health" -UseBasicParsing | ConvertFrom-Json
Write-Host "   Status: $($health.status)" -ForegroundColor Yellow
Write-Host "   Database: $($health.database)" -ForegroundColor Yellow
Write-Host ""

# 2. Registro de Usuario
Write-Host "2️⃣  Registro - Pasajero" -ForegroundColor Green
$registerData = @{
    documento = "1234567890"
    nombres = "Juan"
    primerApellido = "Pérez"
    segundoApellido = "García"
    email = "juan.perez@example.com"
    telefono = "3101234567"
    fechaNacimiento = "1990-01-15"
    contrasena = "password123"
    fotoUrl = "https://via.placeholder.com/150"
    perfil = "PASAJERO"
} | ConvertTo-Json

$register = Invoke-WebRequest -Uri "$baseUrl/register" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body $registerData `
    -UseBasicParsing | ConvertFrom-Json

Write-Host "   Message: $($register.message)" -ForegroundColor Yellow
Write-Host "   Usuario: $($register.usuario.documento)" -ForegroundColor Yellow
Write-Host ""

# 3. Verificación de Email
Write-Host "3️⃣  Verificación de Email" -ForegroundColor Green
Write-Host "   (Código debería estar en logs del servidor)" -ForegroundColor Yellow
$verifyData = @{
    documento = "1234567890"
    codigo = "000000"  # Dummy, el real lo imprime el servidor
} | ConvertTo-Json

try {
    $verify = Invoke-WebRequest -Uri "$baseUrl/verify" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $verifyData `
        -UseBasicParsing | ConvertFrom-Json
    Write-Host "   Result: Código enviado (verificar logs)" -ForegroundColor Yellow
} catch {
    Write-Host "   ⚠️  Expected: Código inválido/expirado (normal sin código real)" -ForegroundColor Yellow
}
Write-Host ""

# 4. Login
Write-Host "4️⃣  Login" -ForegroundColor Green
$loginData = @{
    documento = "1234567890"
    contrasena = "password123"
} | ConvertTo-Json

$login = Invoke-WebRequest -Uri "$baseUrl/login" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body $loginData `
    -UseBasicParsing | ConvertFrom-Json

Write-Host "   Message: $($login.message)" -ForegroundColor Yellow
Write-Host "   Usuario: $($login.usuario.nombres) $($login.usuario.documento)" -ForegroundColor Yellow
Write-Host "   Email: $($login.usuario.email)" -ForegroundColor Yellow
Write-Host ""

# 5. Registro de Conductor
Write-Host "5️⃣  Registro - Conductor" -ForegroundColor Green
$driverData = @{
    documento = "9876543210"
    nombres = "Carlos"
    primerApellido = "López"
    segundoApellido = "Martínez"
    email = "carlos.lopez@example.com"
    telefono = "3107654321"
    fechaNacimiento = "1985-05-20"
    contrasena = "driver123"
    fotoUrl = "https://via.placeholder.com/150"
    perfil = "CONDUCTOR"
} | ConvertTo-Json

$driver = Invoke-WebRequest -Uri "$baseUrl/register" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body $driverData `
    -UseBasicParsing | ConvertFrom-Json

Write-Host "   Conductor registrado: $($driver.usuario.documento)" -ForegroundColor Yellow
Write-Host ""

# 6. Registro de Vehículo
Write-Host "6️⃣  Registro de Vehículo" -ForegroundColor Green
$vehicleData = @{
    documento = "9876543210"
    placa = "ABC123"
    marca = "CHEVROLET"
    modelo = "SPARK"
    anio = 2023
    color = "BLANCO"
    licenciaUrl = "https://example.com/licencia.pdf"
    vehiculoUrl = "https://example.com/vehiculo.jpg"
    licTransitoUrl = "https://example.com/transito.pdf"
    soatUrl = "https://example.com/soat.pdf"
} | ConvertTo-Json

$vehicle = Invoke-WebRequest -Uri "$baseUrl/vehicles" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body $vehicleData `
    -UseBasicParsing | ConvertFrom-Json

Write-Host "   Message: $($vehicle.message)" -ForegroundColor Yellow
Write-Host "   Placa: $($vehicle.vehiculo.placaVeh)" -ForegroundColor Yellow
Write-Host ""

# 7. Listar Vehículos
Write-Host "7️⃣  Listar Vehículos del Conductor" -ForegroundColor Green
$vehicles = Invoke-WebRequest -Uri "$baseUrl/vehicles/9876543210" `
    -UseBasicParsing | ConvertFrom-Json

Write-Host "   Vehículos encontrados: $($vehicles.Count)" -ForegroundColor Yellow
foreach ($v in $vehicles) {
    Write-Host "   - Placa: $($v.placaVeh), Marca: $($v.marca.nombre)" -ForegroundColor Yellow
}
Write-Host ""

# 8. Crear Ruta
Write-Host "8️⃣  Crear Ruta" -ForegroundColor Green
$routeData = @{
    documento = "9876543210"
    placaVehiculo = "ABC123"
    latitudOrigen = 433042960
    longitudOrigen = -740362890
    latitudDestino = 434200000
    longitudDestino = -741500000
    horaSalida = "2026-05-20T08:00:00Z"
    cuposTotales = 3
    precioCupo = 15000
    distanciaKm = 25.5
} | ConvertTo-Json

$route = Invoke-WebRequest -Uri "$baseUrl/routes" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body $routeData `
    -UseBasicParsing | ConvertFrom-Json

Write-Host "   Message: $($route.message)" -ForegroundColor Yellow
Write-Host "   Ruta ID: $($route.ruta.idRut)" -ForegroundColor Yellow
Write-Host "   Cupos disponibles: $($route.ruta.cuposDisponiblesRut)" -ForegroundColor Yellow
Write-Host ""

# 9. Listar Rutas
Write-Host "9️⃣  Listar Rutas Disponibles" -ForegroundColor Green
$routes = Invoke-WebRequest -Uri "$baseUrl/routes" `
    -UseBasicParsing | ConvertFrom-Json

Write-Host "   Rutas encontradas: $($routes.Count)" -ForegroundColor Yellow
foreach ($r in $routes) {
    Write-Host "   - Ruta $($r.idRut): $($r.cuposDisponiblesRut) cupos disponibles" -ForegroundColor Yellow
}
Write-Host ""

# 10. Obtener Datos de Usuario
Write-Host "🔟 Datos de Usuario" -ForegroundColor Green
$user = Invoke-WebRequest -Uri "$baseUrl/users/1234567890" `
    -UseBasicParsing | ConvertFrom-Json

Write-Host "   Nombre: $($user.nombresUsu) $($user.primerApellidoUsu)" -ForegroundColor Yellow
Write-Host "   Email: $($user.correoUsu)" -ForegroundColor Yellow
Write-Host "   Saldo cartera: $($user.saldoCarteraUsu) centavos" -ForegroundColor Yellow
Write-Host ""

Write-Host "✅ TODAS LAS PRUEBAS COMPLETADAS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
