# Storage Modules

Este directorio contiene los módulos de almacenamiento para archivos/imágenes del sistema.

## Módulos Disponibles

### LocalStorage.js
Almacena archivos en el sistema de archivos local del servidor.

**Configuración (.env):**
```env
USE_LOCAL_STORAGE=true
API_URL=http://localhost:8181
```

**Ventajas:**
- No requiere configuración de S3/DigitalOcean
- Ideal para desarrollo y testing
- Sin costos adicionales

**Desventajas:**
- No escalable para producción
- Archivos se pierden al reiniciar contenedores
- No recomendado para deployment en cloud

### S3.js
Almacena archivos en DigitalOcean Spaces o AWS S3.

**Configuración (.env):**
```env
USE_LOCAL_STORAGE=false
S3_BUCKET=nombre-del-bucket
DIGITAL_ACCESS_KEY_ID=tu-access-key
DIGITAL_SECRET_ACCESS_KEY=tu-secret-key
DIGITAL_ENDPOINT=nyc3.digitaloceanspaces.com
```

**Ventajas:**
- Escalable para producción
- Archivos persistentes
- CDN integrado

**Desventajas:**
- Requiere configuración
- Costos por almacenamiento

## Uso

El sistema cambia automáticamente entre LocalStorage y S3 según la variable `USE_LOCAL_STORAGE`.

**En desarrollo:**
```env
USE_LOCAL_STORAGE=true
```

**En producción:**
```env
USE_LOCAL_STORAGE=false
S3_BUCKET=leopet
DIGITAL_ACCESS_KEY_ID=...
DIGITAL_SECRET_ACCESS_KEY=...
DIGITAL_ENDPOINT=nyc3.digitaloceanspaces.com
```

## Tests

Los tests unitarios están en `test/lib/LocalStorage.spec.js`:

```bash
npm test -- test/lib/LocalStorage.spec.js
```
