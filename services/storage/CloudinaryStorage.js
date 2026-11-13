const cloudinary = require('cloudinary').v2;
const path = require('path');

const UPLOAD_FOLDER = 'mascotas';

const configureCloudinary = () => {
  const {
    CLOUDINARY_API_SECRET: apiSecret,
    CLOUDINARY_API_KEY: apiKey,
    CLOUDINARY_CLOUD_NAME: cloudName,
  } = process.env;

  if (!apiSecret || !apiKey || !cloudName) {
    throw new Error(
      'Cloudinary no está configurado. Revisa CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET.',
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
};

const updateFile = async (name, filePath) => {
  configureCloudinary();

  const result = await cloudinary.uploader.upload(filePath, {
    folder: UPLOAD_FOLDER,
    resource_type: 'auto',
    use_filename: true,
    unique_filename: true,
    filename_override: path.basename(name),
  });

  return result.secure_url;
};

const getAssetInfo = (url) => {
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error('La URL del archivo de Cloudinary no es válida.');
  }

  const { CLOUDINARY_CLOUD_NAME: cloudName } = process.env;
  const pathParts = parsedUrl.pathname.split('/').filter(Boolean);

  if (parsedUrl.protocol !== 'https:'
    || parsedUrl.hostname !== 'res.cloudinary.com'
    || pathParts[0] !== cloudName
    || !['image', 'video', 'raw'].includes(pathParts[1])
    || pathParts[2] !== 'upload') {
    throw new Error('La URL no pertenece al almacenamiento de Cloudinary configurado.');
  }

  const uploadIndex = pathParts.indexOf('upload');
  const versionIndex = pathParts.findIndex((part, index) => index > uploadIndex && /^v\d+$/.test(part));
  if (versionIndex === -1 || versionIndex === pathParts.length - 1) {
    throw new Error('No se pudo obtener el identificador del archivo desde la URL de Cloudinary.');
  }

  const resourceType = pathParts[1];
  const publicIdParts = pathParts.slice(versionIndex + 1).map((part) => decodeURIComponent(part));
  let publicId = publicIdParts.join('/');
  if (resourceType !== 'raw') {
    publicId = publicId.replace(/\.[^.]+$/, '');
  }

  return { publicId, resourceType };
};

const deleteFile = async (url) => {
  configureCloudinary();
  const { publicId, resourceType } = getAssetInfo(url);
  const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });

  if (!['ok', 'not found'].includes(result.result)) {
    throw new Error(`Cloudinary no pudo eliminar el archivo: ${result.result}`);
  }

  return { success: true };
};

module.exports = {
  updateFile,
  deleteFile,
};
