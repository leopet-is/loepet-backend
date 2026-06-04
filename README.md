# Backend LEOPET

Backend del proyecto de Materia Integradora — Grupo #3

---

## Stack

- **Runtime:** Node.js 20+
- **Framework:** Express
- **ORM:** Sequelize
- **BD:** MySQL 8.0
- **Auth:** JWT (jsonwebtoken)
- **PayPal:** API de suscripciones (con mock automático en desarrollo)
- **Storage:** Local (desarrollo) / DigitalOcean Spaces (producción)

---

## Requisitos previos

| Herramienta | Versión |
|---|---|
| Node.js | >= 20 |
| npm | >= 10 |
| Docker | 24+ (solo para BD) |
| Docker Compose | plugin incluido |

---

## Setup paso a paso

### 1. Clonar e instalar dependencias

```bash
git clone <url-del-repositorio>
cd leopet-backend-main
npm install
```

### 2. Crear archivo `.env`

El `.env` no está en el repo (está en `.gitignore`). Copiar el siguiente contenido como base:

```env
# Servidor
PORT=8181

# Base de datos MySQL
MYSQL_DATABASE=integradoradb
MYSQL_USER=leopet_user
MYSQL_ROOT_PASSWORD=leopet_pass
MYSQL_HOSTNAME=localhost
MYSQL_ROOT_PORT=3306

# Almacenamiento local (desarrollo)
USE_LOCAL_STORAGE=true
API_URL=http://localhost:8181

# JWT (cambiar en producción)
# JWT_SECRET=mi-secreto-seguro
```

### 3. Levantar MySQL con Docker

```bash
docker compose up -d mysql
```

Esto crea un contenedor `leopet-mysql` con MySQL 8.0, la base `integradoradb`, y ejecuta automáticamente el script `scripts/integradora.sql` que crea las tablas y carga datos de prueba.

### 4. Verificar que MySQL esté listo

```bash
docker compose ps mysql
```

Esperar hasta que el estado sea `(healthy)`.

### 5. Iniciar el servidor

**Opción A — Con nodemon (desarrollo, hot-reload):**

```bash
npm start
```

**Opción B — Con node directamente:**

```bash
node server.js
```

El servidor queda escuchando en `http://localhost:8181`.

Verificar con:

```bash
curl http://localhost:8181/api/health
# → {"status":"OK","timestamp":"..."}
```

---

## Credenciales de prueba

Los datos se cargan automáticamente desde `scripts/integradora.sql`.

| Rol | Email | Contraseña |
|---|---|---|
| Administrador | `admin@gmail.com` | `admin` |
| Donador | `sofiacastro@gmail.com` | `sofiacastro123` |
| Fundación (Colita Feliz) | `colitafeliz@gmail.com` | `colitafeliz123` |
| Fundación (Huellitas) | `refugiohuellitas@gmail.com` | (ver documentación) |
| Fundación (Leopet) | `leopet@gmail.com` | (ver documentación) |

---

## Cómo probar la API

### Login (obtener token)

```bash
curl -X POST http://localhost:8181/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gmail.com","password":"admin"}'
```

Guardar el `token` del JSON de respuesta.

### Endpoints principales

```bash
# Listar animales
curl -X POST http://localhost:8181/animal/get/animals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{}'

# Detalle de animal por ID
curl http://localhost:8181/animal/get/1 \
  -H "Authorization: Bearer TU_TOKEN"

# Especies disponibles
curl http://localhost:8181/animal/especies \
  -H "Authorization: Bearer TU_TOKEN"

# Listar fundaciones
curl http://localhost:8181/fundacion/ \
  -H "Authorization: Bearer TU_TOKEN"
```

### Tests automatizados

```bash
# Tests unitarios (DB, storage, middleware)
npm run test:unit

# Tests completos con cobertura
npm test
```

---

## Comandos útiles

```bash
# Ver logs del servidor (si corre en tmux)
wsl tmux attach -t leopet
# Salir sin cerrar: Ctrl+B, luego D

# Detener MySQL
docker compose down

# Ver logs de MySQL
docker compose logs mysql

# Acceder a MySQL desde el contenedor
docker exec -it leopet-mysql mysql -uroot -pleopet_pass integradoradb

# Ver procesos del servidor
ps aux | grep "node server"
```

---

## Variables de entorno

Todas las variables que usa el proyecto están documentadas en el análisis interno. Resumen rápido:

| Variable | Obligatoria | Descripción |
|---|---|---|
| `PORT` | Sí | Puerto del servidor |
| `MYSQL_DATABASE` | Sí | Nombre de la BD |
| `MYSQL_USER` | Sí | Usuario de BD |
| `MYSQL_ROOT_PASSWORD` | Sí | Contraseña de BD |
| `MYSQL_HOSTNAME` | Sí | Host de BD |
| `MYSQL_ROOT_PORT` | Sí | Puerto de BD |
| `USE_LOCAL_STORAGE` | No | `true` = guarda archivos local |
| `S3_BUCKET` | Si no usa local | Bucket S3/Spaces |
| `DIGITAL_ENDPOINT` | Si no usa local | Endpoint Spaces |
| `DIGITAL_ACCESS_KEY_ID` | Si no usa local | Access key |
| `DIGITAL_SECRET_ACCESS_KEY` | Si no usa local | Secret key |
| `API_URL` | No | URL base para archivos locales |
| `JWT_SECRET` | No (default: `secret`) | Clave para firmar tokens |
| `PAYPAL_CLIENT` | No (usa mock si falta) | Client ID de PayPal |
| `PAYPAL_SECRET` | No (usa mock si falta) | Secret de PayPal |
| `PAYPAL_URI` | No | URL API de PayPal |
| `NODE_ENV` | No | `development`, `test` o `production` |

---

## Notas sobre Docker

El repositorio incluye dos archivos Docker con propósitos distintos:

- **`Dockerfile`**: Empaqueta solo el backend Node.js para deploy. No incluye BD.
- **`docker-compose.yml`**: Levanta MySQL 8.0 local para desarrollo. Creado porque el proyecto no tenía una forma de levantar la BD en Docker (el `Dockerfile` existente solo contenía el backend).
