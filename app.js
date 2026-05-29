require('dotenv').config();

const cors = require('cors');
const express = require('express');
const path = require('path');

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
app.use('/otros', require('./routes/otros'));
app.use('/test', require('./routes/test'));
app.use('/denuncias', require('./routes/denunciaRoutes'));

module.exports = app;
