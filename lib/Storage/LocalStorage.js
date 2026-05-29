const fs = require('fs');
const path = require('path');

// Directorio donde se guardarán las imágenes
const UPLOAD_DIR = path.join(__dirname, '../../uploads');

// Crear el directorio si no existe
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const prefijo = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hora = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const seg = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');

  return `${year}${month}${day}_${hora}${min}${seg}_${ms}`;
};

const updateFile = (
  name,
  filePath,
) => new Promise((resolve, reject) => {
  try {
    // Asegurar que el directorio existe
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    const miprefijo = prefijo();
    const fileName = `${miprefijo}_${name}`;
    const destPath = path.join(UPLOAD_DIR, fileName);

    // Copiar archivo al directorio de uploads
    fs.copyFileSync(filePath, destPath);

    // Retornar la URL relativa
    const baseUrl = process.env.API_URL || 'http://localhost:8181';
    const location = `${baseUrl}/uploads/${fileName}`;

    console.log('====== URL ', location);
    resolve(location);
  } catch (err) {
    reject(err);
  }
});

const deleteFile = (
  name,
) => new Promise((resolve, reject) => {
  try {
    const filePath = path.join(UPLOAD_DIR, name);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    resolve({ success: true });
  } catch (err) {
    reject(err);
  }
});

module.exports = {
  updateFile,
  deleteFile,
};
