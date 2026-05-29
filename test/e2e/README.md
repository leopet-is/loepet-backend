# Tests de Integración Backend - Documentación Técnica

Este directorio contiene las pruebas de integración End-to-End (E2E) para la API del backend de Leopet. Estas pruebas validan el flujo completo de los datos: desde la petición HTTP, pasando por controladores y modelos, hasta la persistencia en la base de datos.

## 🧠 Lógica y Arquitectura de Pruebas

Para asegurar la robustez del sistema sin depender de servicios externos costosos o inestables, utilizamos una estrategia híbrida:

1.  **Base de Datos Real:** Las pruebas se conectan a la base de datos configurada (`integradoradb`), limpian todas las tablas antes de empezar (`sync force`) e inyectan datos semilla. Esto garantiza que las consultas SQL y las relaciones entre modelos funcionen de verdad.
2.  **Servidor Real (`supertest`):** Levantamos una instancia real de la aplicación Express (`app.js`) para probar middlewares, rutas y controladores.
3.  **Servicios Externos Simulados (Mocks):**
    *   **PayPal:** Se simula la respuesta de la API de pagos para probar la lógica de creación de manadas sin realizar transacciones reales.
    *   **AWS S3:** Se fuerza el uso de `LocalStorage` mediante variables de entorno para probar la subida de archivos sin necesitar credenciales de nube.

## 📋 Catálogo de Tests e Historias de Usuario

A continuación se detallan los nuevos tests implementados y qué historias de usuario verifican.

### 1. Gestión de Manadas (`manada-management.spec.js`)

Este test valida el flujo crítico de un Donador gestionando sus manadas de apadrinamiento.

#### 👤 Historias de Usuario Verificadas:

*   **HU: "Como Donador, quiero crear una manada personalizada."** y 
    **HU: "Como Donador, quiero asignar un monto mensual a una manada."**
    *   **Verificación:** Se envía una petición `POST /manada/create` con nombre y monto. Se valida que el servidor responda con éxito (200 OK) y devuelva el objeto de la manada creada con un ID válido.
    *   *Técnica:* Se utiliza un mock de `createProductManada` para evitar errores de conexión con PayPal.

*   **HU: "Como Donador, quiero agregar mascotas a mi manada existente."**
    *   **Verificación:** Se envía una petición `POST /manada/add_animals` vinculando la manada creada con un animal existente. Se valida que la relación se persista en la tabla `ManadaAnimal`.

*   **HU: "Como Donador, quiero que mi manada tenga un estado de suscripción inicial."**
    *   **Verificación:** Se consulta directamente la base de datos para confirmar que el campo `statusSubscription` se inicializa correctamente (en falso/0) antes del pago.

**Comando de Ejecución:**
```bash
npm test test/e2e/manada-management.spec.js
```

### 2. Envío de Evidencias (`evidence-upload.spec.js`)

Este test valida que las fundaciones puedan cumplir con su compromiso de transparencia enviando fotos y reportes.

#### 👤 Historias de Usuario Verificadas:

*   **HU: "Como Fundación, quiero enviar evidencias programadas (fotos) de mis animales."**
    *   **Verificación (Paso 1 - Subida):** Se simula la carga de un archivo de imagen mediante `POST /otros/uploadFile`. Se valida que el servidor guarde el archivo físicamente en la carpeta `uploads/` y devuelva una URL válida.
    *   **Verificación (Paso 2 - Registro):** Se utiliza la URL devuelta para crear un registro formal de evidencia vinculado a una donación mediante `POST /evidencia/crear`. Se valida que los datos se guarden correctamente en la base de datos.
    *   *Técnica:* Se fuerza `process.env.USE_LOCAL_STORAGE = 'true'` para evitar el uso del SDK de AWS S3.

**Comando de Ejecución:**
```bash
npm test test/e2e/evidence-upload.spec.js
```

## ⚠️ Precauciones y Mantenimiento

*   **Limpieza de Datos:** Estos tests borran la base de datos al inicio (`beforeAll`). **No los ejecutes en un entorno de producción.**
*   **Archivos Temporales:** El test de evidencia puede dejar archivos residuales en `backend/uploads/` si la limpieza falla. Es seguro borrarlos manualmente.
*   **Mocks:** Si la lógica de PayPal o S3 cambia en el código principal, los mocks en estos tests deben actualizarse para reflejar la nueva realidad.

## 🚀 Ejecutar Todos los Tests de Integración

Desde la carpeta `backend/`:

```bash
npm test test/e2e/
```
