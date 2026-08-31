require('dotenv').config();

const cors = require('cors');
const express = require('express');
const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const openapiComponents = require('./docs/openapi-components');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Servir archivos estáticos desde la carpeta uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/animal', require('./routes/animal'));
app.use('/auth', require('./routes/auth'));
app.use('/fundacion', require('./routes/fundacion'));
app.use('/manada', require('./routes/manada'));
app.use('/usuario', require('./routes/usuario'));
app.use('/donacion', require('./routes/donacion'));
app.use('/reportes', require('./routes/report'));
app.use('/evidencia', require('./routes/evidencia'));
app.use('/cuenta', require('./routes/cuenta'));
app.use('/actualizacion', require('./routes/actualizacion'));
app.use('/notificacion', require('./routes/notificacion'));
app.use('/favorito', require('./routes/favorito'));
app.use('/comision', require('./routes/comision'));
app.use('/public', require('./routes/public'));
app.use('/admin', require('./routes/solicitudesFundacion'));

app.use('/paypal', require('./routes/paypal'));
app.use('/otros', require('./routes/upload'));
app.use('/test', require('./routes/test'));
app.use('/denuncias', require('./routes/denunciaRoutes'));

// Documentacion de la API (Swagger/OpenAPI renderizada con Scalar)
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'LEOPET API',
      version: '1.0.0',
      description:
        'Documentacion de la API de LEOPET. Autenticación mediante token JWT enviado como `Authorization: Bearer <token>`.',
    },
    servers: [{ url: 'http://localhost:8181' }],
    components: openapiComponents,
  },
  apis: ['./controllers/*.js'],
});

// El paquete de Scalar es ESM-only; se carga con import() diferido para ser
// compatible con Node 20 (entorno del contenedor) y con los tests de Jest.
let apiDocsMiddleware;
async function getApiDocsMiddleware() {
  if (!apiDocsMiddleware) {
    const { apiReference } = await import('@scalar/express-api-reference');
    apiDocsMiddleware = apiReference({ spec: { content: swaggerSpec } });
  }
  return apiDocsMiddleware;
}

app.use('/api-docs', async (req, res, next) => {
  try {
    const middleware = await getApiDocsMiddleware();
    middleware(req, res, next);
  } catch (error) {
    next(error);
  }
});

module.exports = app;
