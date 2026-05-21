# =====================================================
# TESTS PARA USUARIOS - SEMANA 3
# =====================================================

$headers = @{"Content-Type" = "application/json"}
$baseUrl = "http://localhost:4000/api/admin"

# =====================================================
# 1. CREAR USUARIO 1: Conductor
# =====================================================
Write-Host "➕ Creando Usuario 1: Conductor" -ForegroundColor Green

$userBody1 = @{
    nombre = "Juan Pérez"
    email = "juan.perez@vamonospues.com"
    telefono = "3001234567"
    contraseña = "Conductor123"
    idEstado = 1
    perfiles = @(2)  # ID 2 = CONDUCTOR
} | ConvertTo-Json

$response1 = Invoke-WebRequest -Uri "$baseUrl/users" `
  -Method POST -Headers $headers -Body $userBody1 -UseBasicParsing | Select-Object -ExpandProperty Content | ConvertFrom-Json

Write-Host "Respuesta: $($response1 | ConvertTo-Json)" -ForegroundColor Yellow
$usuarioId1 = $response1.data.id
Write-Host "Usuario 1 ID: $usuarioId1" -ForegroundColor Cyan

# =====================================================
# 2. CREAR USUARIO 2: Pasajero
# =====================================================
Write-Host "`n➕ Creando Usuario 2: Pasajero" -ForegroundColor Green

$userBody2 = @{
    nombre = "María García"
    email = "maria.garcia@vamonospues.com"
    telefono = "3019876543"
    contraseña = "Pasajero456"
    idEstado = 1
    perfiles = @(1)  # ID 1 = PASAJERO
} | ConvertTo-Json

$response2 = Invoke-WebRequest -Uri "$baseUrl/users" `
  -Method POST -Headers $headers -Body $userBody2 -UseBasicParsing | Select-Object -ExpandProperty Content | ConvertFrom-Json

Write-Host "Respuesta: $($response2 | ConvertTo-Json)" -ForegroundColor Yellow
$usuarioId2 = $response2.data.id
Write-Host "Usuario 2 ID: $usuarioId2" -ForegroundColor Cyan

# =====================================================
# 3. CREAR USUARIO 3: Admin
# =====================================================
Write-Host "`n➕ Creando Usuario 3: Admin" -ForegroundColor Green

$userBody3 = @{
    nombre = "Carlos López"
    email = "carlos.lopez@vamonospues.com"
    telefono = "3005555555"
    contraseña = "Admin789"
    idEstado = 1
    perfiles = @(3)  # ID 3 = ADMIN
} | ConvertTo-Json

$response3 = Invoke-WebRequest -Uri "$baseUrl/users" `
  -Method POST -Headers $headers -Body $userBody3 -UseBasicParsing | Select-Object -ExpandProperty Content | ConvertFrom-Json

Write-Host "Respuesta: $($response3 | ConvertTo-Json)" -ForegroundColor Yellow
$usuarioId3 = $response3.data.id
Write-Host "Usuario 3 ID: $usuarioId3" -ForegroundColor Cyan

# =====================================================
# 4. OBTENER TODOS LOS USUARIOS
# =====================================================
Write-Host "`n📋 Obteniendo todos los usuarios (página 1)" -ForegroundColor Green

$allUsersResponse = Invoke-WebRequest -Uri "$baseUrl/users?page=1&pageSize=10" `
  -Method GET -Headers $headers -UseBasicParsing | Select-Object -ExpandProperty Content | ConvertFrom-Json

Write-Host "Total de usuarios: $($allUsersResponse.pagination.total)" -ForegroundColor Yellow
Write-Host "Usuarios en esta página: $($allUsersResponse.data.Count)" -ForegroundColor Yellow

# =====================================================
# 5. OBTENER USUARIO POR ID
# =====================================================
Write-Host "`n📄 Obteniendo usuario por ID: $usuarioId1" -ForegroundColor Green

$userResponse = Invoke-WebRequest -Uri "$baseUrl/users/$usuarioId1" `
  -Method GET -Headers $headers -UseBasicParsing | Select-Object -ExpandProperty Content | ConvertFrom-Json

Write-Host "Nombre: $($userResponse.data.nombre)" -ForegroundColor Yellow
Write-Host "Email: $($userResponse.data.email)" -ForegroundColor Yellow
Write-Host "Teléfono: $($userResponse.data.telefono)" -ForegroundColor Yellow
Write-Host "Perfiles: $($userResponse.data.perfiles | ConvertTo-Json)" -ForegroundColor Yellow

# =====================================================
# 6. ACTUALIZAR USUARIO
# =====================================================
Write-Host "`n✏️ Actualizando usuario $usuarioId2" -ForegroundColor Green

$updateBody = @{
    nombre = "María García González"
    email = "maria.garcia.g@vamonospues.com"
    telefono = "3019999999"
    idEstado = 1
    perfiles = @(1)
} | ConvertTo-Json

$updateResponse = Invoke-WebRequest -Uri "$baseUrl/users/$usuarioId2" `
  -Method PUT -Headers $headers -Body $updateBody -UseBasicParsing | Select-Object -ExpandProperty Content | ConvertFrom-Json

Write-Host "Respuesta: $($updateResponse | ConvertTo-Json)" -ForegroundColor Yellow

# =====================================================
# 7. CAMBIAR CONTRASEÑA
# =====================================================
Write-Host "`n🔐 Cambiando contraseña del usuario $usuarioId1" -ForegroundColor Green

$passwordBody = @{
    contraseñaActual = "Conductor123"
    contraseñaNueva = "NuevaContraseña123"
} | ConvertTo-Json

$passwordResponse = Invoke-WebRequest -Uri "$baseUrl/users/$usuarioId1/change-password" `
  -Method POST -Headers $headers -Body $passwordBody -UseBasicParsing | Select-Object -ExpandProperty Content | ConvertFrom-Json

Write-Host "Respuesta: $($passwordResponse | ConvertTo-Json)" -ForegroundColor Yellow

# =====================================================
# 8. INTENTAR EMAIL DUPLICADO (DEBE FALLAR)
# =====================================================
Write-Host "`n❌ Intentando crear usuario con email duplicado (debe fallar)" -ForegroundColor Green

$duplicateBody = @{
    nombre = "Usuario Duplicado"
    email = "juan.perez@vamonospues.com"  # Email ya existe
    telefono = "3001111111"
    contraseña = "Duplicado123"
    idEstado = 1
    perfiles = @(1)
} | ConvertTo-Json

try {
    $duplicateResponse = Invoke-WebRequest -Uri "$baseUrl/users" `
      -Method POST -Headers $headers -Body $duplicateBody -UseBasicParsing | Select-Object -ExpandProperty Content | ConvertFrom-Json
    Write-Host "ERROR: Debería haber fallado!" -ForegroundColor Red
} catch {
    Write-Host "✓ Correctamente rechazado: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
}

# =====================================================
# 9. ELIMINAR USUARIO
# =====================================================
Write-Host "`n🗑️ Eliminando usuario $usuarioId3" -ForegroundColor Green

$deleteResponse = Invoke-WebRequest -Uri "$baseUrl/users/$usuarioId3" `
  -Method DELETE -Headers $headers -UseBasicParsing | Select-Object -ExpandProperty Content | ConvertFrom-Json

Write-Host "Respuesta: $($deleteResponse | ConvertTo-Json)" -ForegroundColor Yellow

# =====================================================
# 10. VERIFICAR ELIMINACIÓN
# =====================================================
Write-Host "`n📋 Verificando usuarios después de eliminación" -ForegroundColor Green

$finalResponse = Invoke-WebRequest -Uri "$baseUrl/users?page=1&pageSize=10" `
  -Method GET -Headers $headers -UseBasicParsing | Select-Object -ExpandProperty Content | ConvertFrom-Json

Write-Host "Total de usuarios: $($finalResponse.pagination.total)" -ForegroundColor Yellow

Write-Host "`n✅ PRUEBAS COMPLETADAS" -ForegroundColor Green
