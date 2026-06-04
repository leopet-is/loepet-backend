# Flujo de Autenticación

## Roles

| Valor | Nombre            | Descripción                                    |
|-------|-------------------|------------------------------------------------|
| 1     | ADMIN             | SuperAdmin — control total del sistema         |
| 2     | ADMIN_FUND        | Admin de una fundación — gestiona su fundación |
| 3     | DONADOR           | Usuario donante — apadrina animales            |

## Cómo funciona

1. El cliente envía `POST /auth/login` con `email` + `password`.
2. El servidor valida contra la tabla `usuario` (bcrypt).
3. Si es válido, firma un **JWT** con:
   - Payload: `{ id, role, fundacionId? }`
   - Secreto: `'secret'` (hardcoded en `middlewares/passport.js`)
   - Expiración: 28800 segundos (8 horas)
4. El cliente debe enviar el token en cada request:
   ```
   Authorization: Bearer <token>
   ```
5. El middleware `passport.authenticate('jwt')` verifica el token y carga `req.user`:
   ```json
   {
     "id": 2,
     "role": 1,
     "fundacionId": null
   }
   ```
6. Para rutas que requieren un rol específico, se usa `roleMiddleware([ROL])` que compara `req.user.role`.

## Rutas por rol

| Rol         | Acceso principal                                                    |
|-------------|---------------------------------------------------------------------|
| ADMIN (1)   | Todo: CRUD usuarios, aprobar donaciones, gestionar solicitudes, reportes |
| ADMIN_FUND (2) | Su fundación: animales, manadas, cuentas, evidencias, comisiones   |
| DONADOR (3) | Ver animales, donar, favoritos, calificar actualizaciones, denunciar |

## Registro

`POST /auth/register` crea un usuario. Si `role = 2` (ADMIN_FUND), requiere `fundacionId` para asociarlo a una fundación existente.

## Notas

- El JWT_SECRET está hardcoded como `'secret'` — **no apto para producción**. Debe moverse a variable de entorno.
- No hay refresh token — al expirar, el usuario debe volver a login.
- `habilitado` en tabla `usuario` permite desactivar cuentas sin eliminarlas.
