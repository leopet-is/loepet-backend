# Backend LEOPET

Backend del proyecto de Materia Integradora — Grupo #3

---

## Stack

- **Runtime:** Node.js 20+
- **Framework:** Express
- **ORM:** Sequelize
- **BD:** PostgreSQL (Supabase en producción y proyecto Supabase separado para tests)
- **Auth:** JWT (jsonwebtoken)
- **PayPal:** API de suscripciones (con mock automático en desarrollo)
- **Storage:** Local (desarrollo) / Supabase Storage (producción)
- **Correo:** Resend (modo `console` en desarrollo sin API key / API Resend en producción)

---

## Requisitos previos

| Herramienta | Versión |
|---|---|
| Node.js | >= 20 |
| npm | >= 10 |
| Docker | 24+ (para ejecutar la app en Render o Postgres local opcional) |
| Docker Compose | plugin incluido (opcional para desarrollo local) |

---

## Setup paso a paso

### 1. Clonar e instalar dependencias

```bash
git clone <url-del-repositorio>
cd leopet-backend-main
npm install
```

### 2. Crear archivo `.env`

El `.env` no está en el repo (está en `.gitignore`). Copiar el ejemplo como base y adaptarlo:

```bash
cp .env.example .env
```

El desarrollo local y los tests usan una sola `DATABASE_URL`, que debe apuntar al proyecto Supabase de pruebas descartable. Configura `DB_SSL=true`. No pongas la URL de producción en tu `.env`: algunos tests recrean tablas y borran sus datos.

> **Importante:** `npm test` y `npm run test:unit` usan `DATABASE_URL`; no es necesario levantar Docker para ejecutar tests.

### 3. Base de datos local opcional

```bash
docker compose up -d postgres
```

Si prefieres no usar Supabase para desarrollo local, puedes levantar un Postgres local y establecer `DB_SSL=false`:

Esto crea:
- `leopet-postgres`: PostgreSQL 16 con la base `leopet_dev` (usuario/contraseña `leopet`).

### 4. Verificar que estén listos

```bash
docker compose ps
```

Esperar hasta que el estado de `leopet-postgres` sea `(healthy)`.

### 5. Aplicar migraciones e iniciar el servidor

```bash
npm run db:migrate
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

### 6. Probar el correo (opcional)

```bash
npm run email:test
```

Si no hay `RESEND_API_KEY` (desarrollo) el correo solo se imprime en la consola (modo `console`). Con la API key se envía por Resend y puedes verlo en el dashboard de https://resend.com.

---

## Credenciales de prueba

Los datos de ejemplo pueden cargarse con `npm run db:migrate` y luego opcionalmente con `node scripts/seed-v2.js` (posterior a las migraciones).

| Rol | Email | Contraseña |
|---|---|---|
| Administrador | `admin@gmail.com` | `Leopet2025!` |
| Donador | `donador@gmail.com` | `Leopet2025!` |
| Donador | `sofiacastro@gmail.com` | `Leopet2025!` |
| Fundación (Colita Feliz) | `colitafeliz@gmail.com` | `Leopet2025!` |
| Fundación (Huellitas) | `refugiohuellitas@gmail.com` | `Leopet2025!` |
| Fundación (Leopet) | `leopet@gmail.com` | `Leopet2025!` |

---

## Cómo probar la API

### Login (obtener token)

```bash
curl -X POST http://localhost:8181/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gmail.com","password":"Leopet2025!"}'
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

### Documentación de la API (Scalar)

La API expone su documentación interactiva (OpenAPI 3.1) en:

```bash
# Abrir en el navegador
http://localhost:8181/api-docs
```

La documentación se genera a partir de anotaciones `@openapi` (JSDoc) en
`controllers/*.js` usando `swagger-jsdoc`. Para probar los endpoints
autenticados usa el botón **Authorize** y pega el token del `login`.

### Tests automatizados

```bash
# Tests unitarios (DB, storage, middleware)
npm run test:unit

# Tests completos con cobertura
npm test

# Aplicar las migraciones a la BD definida en DATABASE_URL
npm run db:migrate:test
```

Las pruebas E2E pueden recrear tablas y borrar datos. Usa para `DATABASE_URL` un proyecto de pruebas aislado y descartable, nunca producción.

GitHub Actions usa el secreto `DATABASE_URL`, que debe contener la conexión al proyecto de pruebas aislado; configúralo en Settings → Secrets and variables → Actions. El workflow aplica las migraciones y ejecuta la suite allí. Render configura su propio `DATABASE_URL` con la conexión de producción.

---

## Comandos útiles

```bash
# Ver logs del servidor (si corre en tmux)
wsl tmux attach -t leopet
# Salir sin cerrar: Ctrl+B, luego D

# Detener el entorno (Postgres y app)
docker compose down

# Ver logs de Postgres
docker compose logs postgres

# Acceder a Postgres desde el contenedor
docker exec -it leopet-postgres psql -U leopet -d leopet_dev

# Ver procesos del servidor
ps aux | grep "node server"
```

---

## Variables de entorno

Variables principales (`cp .env.example .env` para desarrollo; en producción se definen en el proveedor):

| Variable | Obligatoria | Descripción |
|---|---|---|
| `PORT` | Sí | Puerto del servidor |
| `DATABASE_URL` | Sí | Única cadena de PostgreSQL; usa el proyecto de pruebas localmente/en CI y producción solo en Render |
| `DB_SSL` | No | `true` para Supabase; `false` para Postgres local sin TLS |
| `STORAGE_PROVIDER` | No | `local` (desarrollo) o `supabase` (producción) |
| `SUPABASE_URL` | En prod | URL del proyecto Supabase |
| `SUPABASE_KEY` | En prod | Anon o service-role key de Supabase |
| `SUPABASE_BUCKET` | No | Bucket de imágenes en Supabase (default `uploads`) |
| `API_URL` | No | URL base para archivos del storage local (dev: `http://localhost:8181`) |
| `RESEND_API_KEY` | No (usa `console` si falta) | API key de Resend (desarrollo: omitir → solo imprime) |
| `RESEND_FROM` | No | Remitente por defecto (debe usar dominio verificado en Resend) |
| `MAIL_TO` | No | Destinatario de `npm run email:test` (default `dev@test.com`) |
| `JWT_SECRET` | Sí en producción | Secreto largo y aleatorio para firmar tokens (en desarrollo usa `secret` por defecto) |
| `PAYPAL_CLIENT` | No (usa mock si falta) | Client ID de PayPal |
| `PAYPAL_SECRET` | No (usa mock si falta) | Secret de PayPal |
| `PAYPAL_URI` | No | URL API de PayPal (dev: sandbox) |
| `NODE_ENV` | No | `development`, `test` o `production` |

---

## Despliegue en Render

El archivo `render.yaml` configura el servicio web usando el `Dockerfile` y el health check `/api/health`. Configura en Render `DATABASE_URL`, `JWT_SECRET`, `SUPABASE_URL` y `SUPABASE_KEY`; `STORAGE_PROVIDER=supabase` y `DB_SSL=true` están declaradas en el Blueprint. Antes del primer despliegue, aplica migraciones a la BD de producción con `npm run db:migrate` usando su `DATABASE_URL`. No ejecutes `db:migrate:test` en producción.

## Notas sobre Docker

El repositorio incluye dos archivos Docker con propósitos distintos:

- **`Dockerfile`**: Empaqueta el backend Node.js para Render. No incluye BD ni correo.
- **`docker-compose.yml`**: Opción local — levanta PostgreSQL 16 para desarrollo y, opcionalmente, la app. No es necesario si `DATABASE_URL` apunta a la Supabase de pruebas.
