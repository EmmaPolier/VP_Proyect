# API Endpoints Disponibles

## Base URL
```
http://localhost:4000
```

## Endpoints

### 1. Test
**GET** `/test`

Verifica que la API está funcionando.

**Response:**
```json
{
  "message": "API is working!"
}
```

---

### 2. Obtener Todos los Usuarios
**GET** `/users`

Retorna lista de todos los usuarios.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Juan Pérez",
    "email": "juan@example.com"
  },
  {
    "id": 2,
    "name": "María González",
    "email": "maria@example.com"
  }
]
```

---

### 3. Obtener Usuario por ID
**GET** `/users/:id`

Retorna un usuario específico.

**Example:** `GET /users/1`

**Response:**
```json
{
  "id": 1,
  "name": "Juan Pérez",
  "email": "juan@example.com"
}
```

---

### 4. Crear Usuario
**POST** `/users`

Crea un nuevo usuario.

**Request Body:**
```json
{
  "name": "Carlos López",
  "email": "carlos@example.com"
}
```

**Response (201):**
```json
{
  "id": 3,
  "name": "Carlos López",
  "email": "carlos@example.com"
}
```

---

### 5. Actualizar Usuario
**PUT** `/users/:id`

Actualiza un usuario existente.

**Example:** `PUT /users/1`

**Request Body:**
```json
{
  "name": "Juan Carlos Pérez",
  "email": "juancarlos@example.com"
}
```

**Response:**
```json
{
  "id": 1,
  "name": "Juan Carlos Pérez",
  "email": "juancarlos@example.com"
}
```

---

### 6. Eliminar Usuario
**DELETE** `/users/:id`

Elimina un usuario.

**Example:** `DELETE /users/1`

**Response:**
```json
{
  "id": 1,
  "name": "Juan Carlos Pérez",
  "email": "juancarlos@example.com"
}
```

---

## Headers CORS

La API permite solicitudes desde cualquier origen:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type
```

## Content-Type

Todas las solicitudes POST/PUT deben incluir:
```
Content-Type: application/json
```

## Ejemplos con cURL

```bash
# Test
curl http://localhost:4000/test

# Obtener todos
curl http://localhost:4000/users

# Obtener uno
curl http://localhost:4000/users/1

# Crear
curl -X POST http://localhost:4000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com"}'

# Actualizar
curl -X PUT http://localhost:4000/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated","email":"updated@example.com"}'

# Eliminar
curl -X DELETE http://localhost:4000/users/1
```
