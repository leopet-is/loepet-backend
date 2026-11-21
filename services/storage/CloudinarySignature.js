const crypto = require('crypto');

const UPLOAD_FOLDER = 'mascotas';

exports.getCloudinarySignature = (req, res) => {
  const {
    CLOUDINARY_API_SECRET: apiSecret,
    CLOUDINARY_API_KEY: apiKey,
    CLOUDINARY_CLOUD_NAME: cloudName,
  } = process.env;

  if (!apiSecret || !apiKey || !cloudName) {
    return res.status(503).json({
      status: 'fail',
      message: 'El servicio de imágenes no está configurado',
    });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = `folder=${UPLOAD_FOLDER}&timestamp=${timestamp}`;
  const signature = crypto
    .createHash('sha1')
    .update(`${paramsToSign}${apiSecret}`)
    .digest('hex');

  return res.json({
    signature,
    timestamp,
    folder: UPLOAD_FOLDER,
    apiKey,
    cloudName,
  });
};
