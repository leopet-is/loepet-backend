/**
 * Tipos MIME permitidos para la subida de archivos (imagenes, PDF y video).
 * Deben coincidir con los tipos soportados por el proveedor de storage
 * (ver services/storage/SupabaseStorage.js -> getContentType).
 */
const MIME_TIPOS_PERMITIDOS = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
  'video/mp4': '.mp4',
};

const esMimePermitido = (mimetype = '') => Object.prototype
  .hasOwnProperty.call(MIME_TIPOS_PERMITIDOS, mimetype.toLowerCase());

module.exports = {
  MIME_TIPOS_PERMITIDOS,
  esMimePermitido,
};
