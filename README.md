# Backend LEOPET

Backend del proyecto de Materia Integradora — Grupo #3

---

## Stack

- **Runtime:** Node.js 20+
- **Framework:** Express
- **ORM:** Sequelize
- **BD:** PostgreSQL (Supabase en producción / local en Docker para desarrollo)
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

El `.env` no está en el repo (está en `.gitignore`). Copiar el ejemplo como base y adaptarlo:

```bash
cp .env.example .env
```

Con la configuración de desarrollo local (ya viene por defecto en `.env.example`): la BD apunta a `postgresql://leopet:leopet@localhost:5432/leopet_dev`, `DB_SSL=false`, `STORAGE_PROVIDER=local` y el correo en modo `console` (sin `RESEND_API_KEY` solo se imprime en los logs).

> **Importante:** en desarrollo la BD es un Postgres local; la de Supabase no se toca.

### 3. Levantar Postgres con Docker

```bash
docker compose up -d postgres
```

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
```

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
| `DATABASE_URL` | Sí | Cadena de conexión PostgreSQL (ej. Supabase o local `...@localhost:5432/leopet_dev`) |
| `DB_SSL` | No | `true` obliga SSL (producción/Supabase). En dev local dejar `false` o vacío |
| `STORAGE_PROVIDER` | No | `local` (desarrollo) o `supabase` (producción) |
| `SUPABASE_URL` | En prod | URL del proyecto Supabase |
| `SUPABASE_KEY` | En prod | Anon o service-role key de Supabase |
| `SUPABASE_BUCKET` | No | Bucket de imágenes en Supabase (default `uploads`) |
| `API_URL` | No | URL base para archivos del storage local (dev: `http://localhost:8181`) |
| `RESEND_API_KEY` | No (usa `console` si falta) | API key de Resend (desarrollo: omitir → solo imprime) |
| `RESEND_FROM` | No | Remitente por defecto (debe usar dominio verificado en Resend) |
| `MAIL_TO` | No | Destinatario de `npm run email:test` (default `dev@test.com`) |
| `JWT_SECRET` | No (default: `secret`) | Clave para firmar tokens |
| `PAYPAL_CLIENT` | No (usa mock si falta) | Client ID de PayPal |
| `PAYPAL_SECRET` | No (usa mock si falta) | Secret de PayPal |
| `PAYPAL_URI` | No | URL API de PayPal (dev: sandbox) |
| `NODE_ENV` | No | `development`, `test` o `production` |

---

## Notas sobre Docker

El repositorio incluye dos archivos Docker con propósitos distintos:

- **`Dockerfile`**: Empaqueta el backend Node.js para deploy (Render/VPS). No incluye BD ni correo.
- **`docker-compose.yml`**: Entorno local — levanta **PostgreSQL 16** (dev) y, opcionalmente, la propia app (`docker compose up app`). La BD y credenciales reales de producción viven fuera del Dockerfile (Supabase + variables del proveedor).
