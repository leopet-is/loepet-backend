# API Reference — LEOPET Backend

Base URL: `http://localhost:8181`

Todas las rutas protegidas requieren el header:

```
Authorization: Bearer <token>
```

El token se obtiene de `POST /auth/login`.

---

## Health Check

```
GET /api/health
```

Sin autenticación. Respuesta:
```json
{"status": "OK", "timestamp": "2026-05-31T22:00:00.000Z"}
```

---

## Auth

### Login

```
POST /auth/login
```

Body:
```json
{
  "email": "admin@gmail.com",
  "password": "admin"
}
```

Respuesta:
```json
{
  "result": {
    "id": 2,
    "role": 1,
    "nombres": "Alexandra",
    "apellidos": "Ramos",
    "email": "admin@gmail.com",
    "token": "eyJ..."
  },
  "expiresIn": 28800,
  "tokenType": "Bearer"
}
```

Roles: `1`=Admin, `2`=Admin Fundación, `3`=Donador.

### Register

```
POST /auth/register
```

Body:
```json
{
  "cedula": "0999999999",
  "nombres": "Nombre",
  "apellidos": "Apellido",
  "telefono": "0999999999",
  "email": "user@mail.com",
  "password": "123456",
  "role": 3,
  "direccion": "Dirección (opcional)",
  "fundacionId": 1
}
```

`fundacionId` solo si role = 2 (Admin Fundación).

---

## Animales

### Listar animales

```
POST /animal/get/animals
```

Auth requerida.

Query params: `?page=1&limit=10`

Body (opcional):
```json
{
  "especie": "Perro",
  "manada": 1
}
```

### Listar animales (App)

```
POST /animal/get/animalsApp
```

Auth requerida.

Query: `?page=1&limit=10`

Body:
```json
{
  "tipoAnimal": "Perro"
}
```

### Listar animales por fundación (App)

```
POST /animal/get/animalsFundacionApp
```

Auth requerida.

Query: `?page=1&limit=10`

Body:
```json
{
  "id_fundacion": 1
}
```

### Detalle de animal

```
GET /animal/get/:animalId
```

Auth requerida.

### Crear animal

```
POST /animal/create
```

Auth requerida.

Body:
```json
{
  "nombre": "Firulais",
  "especie": "Perro",
  "raza": "Mestizo",
  "descripcion": "Rescatado de la calle",
  "galeria": { "fotos": ["url1", "url2"] },
  "sexo": true,
  "peso": 15,
  "enfermedades": "Ninguna",
  "esterilizacion": true,
  "vacunacion": true,
  "desparasitacion": true
}
```

### Actualizar animal

```
PUT /animal/update/:animalId
```

Auth requerida.

Body: mismos campos que create (todos opcionales).

### Eliminar animal

```
DELETE /animal/delete/:animalId
```

Auth requerida.

### Buscar animal

```
GET /animal/search?q=nombre
```

Auth requerida.

### Especies

```
GET /animal/especies
```

Auth requerida.

Respuesta:
```json
{"result": ["Perro", "Gato"]}
```

---

## Fundaciones

### Listar fundaciones

```
GET /fundacion/?page=1&limit=10&q=nombre
```

Auth requerida.

### Listar animales de fundaciones

```
GET /fundacion/animales?page=1&limit=10
```

Auth requerida.

### Padrinos de fundación

```
GET /fundacion/padrinos/:fundacionId?page=1&limit=10
```

Sin autenticación.

### Padrinos con calificación

```
GET /fundacion/padrinosCalificacion/:fundacionId?page=1&limit=10
```

Sin autenticación.

### Crear fundación

```
POST /fundacion/create
```

Auth requerida.

Body:
```json
{
  "ruc": "1234567890001",
  "nombre": "Nombre Fundación",
  "direccion": "Dirección",
  "telefono": "0999999999",
  "comision": 5,
  "user_id": 5,
  "id": 1
}
```

`id` = id de la solicitud de fundación.

### Registrar fundación

```
POST /fundacion/register
```

Sin autenticación.

Body:
```json
{
  "ruc": "1234567890001",
  "nombre": "Nombre",
  "direccion": "Dirección",
  "telefono": "0999999999",
  "comision": 5
}
```

### Actualizar fundación

```
PUT /fundacion/update
```

Auth requerida.

Body:
```json
{
  "id": 1,
  "ruc": "...",
  "nombre": "...",
  "direccion": "...",
  "telefono": "...",
  "aprobado": true,
  "comision": 5
}
```

### Eliminar fundación

```
POST /fundacion/delete
```

Auth requerida.

Body:
```json
{"fundacionId": 1}
```

---

## Manadas

### Crear manada

```
POST /manada/create
```

Auth requerida.

Body:
```json
{
  "nombre": "Manada Alfa",
  "monto": 10,
  "galeriamanada": { "fotos": [] }
}
```

### Agregar animales a manada

```
POST /manada/add_animals
```

Auth requerida.

Body:
```json
{
  "manada": { "animalId": [1, 2, 3] },
  "manadaId": 1
}
```

### Listar manadas

```
GET /manada/all?page=1&limit=10&q=nombre
```

Auth requerida.

### Buscar manada

```
GET /manada/search?q=nombre
```

Auth requerida.

### Animales de una manada

```
GET /manada/:manadaId
```

Auth requerida.

### Eliminar animal de manada

```
POST /manada/delete_animal
```

Auth requerida.

Body:
```json
{"manadaId": 1, "animalId": 2}
```

### Eliminar manada

```
POST /manada/delete
```

Auth requerida.

Body:
```json
{"id": 1}
```

### Actualizar manada

```
POST /manada/update_info
```

Auth requerida.

Body:
```json
{
  "id": 1,
  "nombre": "Nuevo nombre",
  "monto": 15,
  "galeriamanada": { "fotos": [] }
}
```

---

## Usuarios

### Listar usuarios

```
GET /usuario/all?page=1&limit=10&q=nombre&role=3
```

Auth requerida.

### Actualizar información

```
PUT /usuario/:id
```

Auth requerida.

Body:
```json
{
  "cedula": "0999999999",
  "nombres": "Nombre",
  "apellidos": "Apellido",
  "direccion": "Dirección",
  "telefono": "0999999999"
}
```

### Cambiar contraseña

```
PATCH /usuario/update
```

Auth requerida.

Body:
```json
{
  "id": 1,
  "password": "actual",
  "newPassword": "nueva"
}
```

### Cambiar estado (habilitar/deshabilitar)

```
PUT /usuario/status/:id
```

Auth requerida (solo Admin).

Body:
```json
{"habilitado": false}
```

---

## Donaciones

### Listar donaciones

```
GET /donacion/?page=1&limit=10
```

Auth requerida.

### Dinero disponible

```
GET /donacion/disponible
```

Auth requerida.

### Aprobar donación

```
PUT /donacion/aprobar
```

Auth requerida.

Body:
```json
{"id": 1, "aprobado": true}
```

### Marcar como pagado

```
PUT /donacion/pagado
```

Auth requerida.

Body:
```json
{"id": 1, "status": true}
```

### Crear donación

```
POST /donacion/crear
```

Auth requerida.

Body:
```json
{"manadaId": 1}
```

---

## Evidencias

### Crear evidencia

```
POST /evidencia/crear
```

Auth requerida.

Body:
```json
{
  "donacion": 1,
  "descripcion": "Compra de alimento",
  "galeria": { "fotos": ["url"] }
}
```

### Actualizar evidencia

```
PUT /evidencia/update/:id
```

Auth requerida.

Body:
```json
{
  "descripcion": "Nueva descripción",
  "galeria": { "fotos": ["url"] }
}
```

---

## Cuentas Bancarias

### Obtener cuenta

```
GET /cuenta/get/:id
```

Auth requerida.

### Obtener cuenta principal

```
GET /cuenta/getPrincipal/:id
```

Auth requerida.

### Listar cuentas de fundación

```
GET /cuenta/getAll/:id?page=1&limit=10
```

Auth requerida.

### Crear cuenta

```
POST /cuenta/crear
```

Auth requerida.

Body:
```json
{
  "banco": "PICHINCHA",
  "numero": "1234567890",
  "tipo": "AHORROS",
  "nombre": "Titular",
  "fundacionId": 1
}
```

### Actualizar cuenta

```
PUT /cuenta/update/:id
```

Auth requerida.

Body:
```json
{
  "banco": "BOLIVARIANO",
  "numero": "0987654321",
  "tipo": "CORRIENTE",
  "nombre": "Titular"
}
```

### Actualizar cuenta por ID de cuenta

```
PUT /cuenta/updateCuentaID/:cuenta_id
```

Auth requerida. Mismos campos que update.

### Establecer cuenta principal

```
PUT /cuenta/updatePrincipal/:fundacion_id
```

Auth requerida.

Body:
```json
{"id": 2}
```

### Eliminar cuenta

```
DELETE /cuenta/delete/:cuentaId
```

Auth requerida.

---

## Actualizaciones de Animal

### Crear actualización

```
POST /actualizacion/create
```

Auth requerida.

Body:
```json
{
  "descripcion": "Visita al veterinario",
  "estado_salud": "Muy Bien",
  "animal_id": 1,
  "fundacion_id": 1,
  "fecha": "2024-01-15",
  "galeria": { "fotos": ["url"] }
}
```

### Listar actualizaciones

```
GET /actualizacion/?fundacionId=1&page=1&limit=10
```

Auth requerida.

### Actualizar actualización

```
PUT /actualizacion/update/:actualizacionId
```

Auth requerida.

Body:
```json
{
  "descripcion": "Nueva descripción",
  "estado_salud": "Regular",
  "galeria": { "fotos": ["url"] }
}
```

### Eliminar actualización

```
DELETE /actualizacion/delete/:actualizacionId
```

Auth requerida.

### Crear calificación

```
POST /actualizacion/create/rating
```

Auth requerida.

Body:
```json
{
  "valor": 5,
  "actualizacion_id": 1
}
```

### Cargar calificación

```
POST /actualizacion/load/rating
```

Auth requerida.

Body:
```json
{"id": 1}
```

---

## Notificaciones

### Crear notificación (Admin)

```
POST /notificacion/admin
```

Auth requerida (rol Admin).

Body:
```json
{
  "fundacionId": 1,
  "mensaje": "Su fundación ha sido aprobada"
}
```

### Notificaciones de fundación

```
GET /notificacion/fundacion
```

Auth requerida (rol Admin Fundación).

### Notificaciones del usuario

```
GET /notificacion/
```

Auth requerida.

### Actualizar notificación

```
PUT /notificacion/update/:notificacionId
```

Auth requerida.

Body:
```json
{
  "leido": true,
  "fecha_leido": "2024-01-15",
  "calificacion": 5,
  "fecha_calificacion": "2024-01-15"
}
```

---

## Favoritos

### Agregar favorito

```
POST /favorito/agregar/:fundacionId
```

Auth requerida.

### Eliminar favorito

```
DELETE /favorito/eliminar/:fundacionId
```

Auth requerida.

### Listar favoritos

```
GET /favorito/
```

Auth requerida.

### Verificar favorito

```
GET /favorito/verificar/:fundacionId
```

Auth requerida.

---

## Comisiones

### Crear comisión

```
POST /comision/create
```

Auth requerida.

Body:
```json
{
  "fundacionId": 1,
  "total_comision": 50.00,
  "total_pago": 450.00,
  "animales": [
    { "manadaid": 1, "animalid": 1, "monto": 100, "montocomision": 10, "total": 90 }
  ]
}
```

### Comisiones por fundación

```
GET /comision/fundacion
```

Auth requerida.

---

## Solicitudes de Fundación (público)

### Crear solicitud

```
POST /public/solicitudes
```

Sin autenticación.

Body:
```json
{
  "ruc": "1234567890001",
  "nombre": "Mi Fundación",
  "direccion": "Dirección",
  "telefono": "0999999999",
  "email_contacto": "contacto@fundacion.com",
  "nombre_contacto": "Juan",
  "apellido_contacto": "Pérez",
  "cedula_contacto": "0912345678",
  "comentarios": "Descripción opcional"
}
```

---

## Solicitudes (Admin)

### Listar solicitudes listas para crear

```
GET /admin/solicitudes/ready-for-creation
```

Auth requerida (Admin).

### Listar todas las solicitudes

```
GET /admin/solicitudes?estado=pendiente&page=1&limit=10
```

Auth requerida (Admin).

### Detalle de solicitud

```
GET /admin/solicitudes/:solicitudId
```

Auth requerida (Admin).

### Aprobar solicitud

```
PUT /admin/solicitudes/:solicitudId/aprobar
```

Auth requerida (Admin).

### Rechazar solicitud

```
PUT /admin/solicitudes/:solicitudId/rechazar
```

Auth requerida (Admin).

Body:
```json
{"notas_admin": "Documentación incompleta"}
```

---

## Denuncias

### Crear denuncia

```
POST /denuncias/
```

Auth requerida (rol Donador). Multipart.

Campos:
- `fundacionId` (number)
- `motivo` (string)
- `archivos` (file, hasta 5 archivos)

### Denuncias agrupadas por fundación

```
GET /denuncias/agrupadas?estado=pendiente
```

Auth requerida (rol Admin).

### Rechazar denuncia

```
PUT /denuncias/:id/rechazar
```

Auth requerida (rol Admin).

Body:
```json
{"motivo_rechazo": "No corresponde"}
```

---

## Reportes

### Transferencias (SuperAdmin)

```
GET /reportes/transferencias?fecha=2024-01-15
```

Auth requerida.

---

## PayPal (Webhooks)

Sin autenticación. Endpoints para recibir eventos de PayPal:

```
POST /paypal/verify/subscription
POST /paypal/verify/payment/failed
POST /paypal/cancel/subscription
```

---

## Otros / Archivos

### Subir archivo

```
POST /otros/uploadFile
```

Auth requerida. Multipart (`file` field, hasta 5 archivos).

### Eliminar archivo

```
POST /otros/deleteFile
```

Body:
```json
{"file": "https://bucket.url/archivo.jpg"}
```

---

## Tests

### Limpiar BD

```
POST /test/clear-db
```

Sin autenticación. Elimina todos los registros de tablas específicas.

### Crear donación de prueba

```
POST /test/create-donation
```

Auth requerida.

Body:
```json
{
  "donador_id": 1,
  "animal_id": 1,
  "monto": 50,
  "aprobado": true,
  "pagado": false
}
```
