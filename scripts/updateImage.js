const fs = require('fs');
const LocalStorage = require('../lib/Storage/LocalStorage');
const S3 = require('../lib/Storage/S3');

/**
 * Obtiene el motor de almacenamiento según la configuración actual
 */
const getStorage = () => {
  const USE_LOCAL_STORAGE = process.env.USE_LOCAL_STORAGE === 'true';
  return USE_LOCAL_STORAGE ? LocalStorage : S3;
};

/**
 * Funcion para subir material de tipo multimedia al bucket creado en Amazon S3
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.uploadFile = async (req, res) => {
  try {
    const { files } = req;

    if (!files || files.length === 0) {
      return res.status(400).send({
        message: 'No files provided',
      });
    }

    const fotos = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const file of files) {
      const { path: filePath, originalname: fileName } = file;
      // eslint-disable-next-line no-await-in-loop
      const location = await getStorage().updateFile(fileName, filePath, {
        // Bucket: 'proyecto.imagenes',
        Bucket: process.env.S3_BUCKET,
      });
      fotos.push(location);
      fs.unlinkSync(filePath);
    }
    const response = {
      message: 'Imagen subida exitosamente',
      fotos,
    };
    return res.status(200).send(response);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('ERROR', error);
    const responseError = {
      message: 'Something bad happened!',
      error: error.stack,
    };
    return res.status(500).send(JSON.stringify(responseError));
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const { file } = req.body;
    const len = file.length;
    const lenhttps = 'https://';
    const bucket = process.env.DIGITAL_BUCKET || '';
    const endpoint = process.env.DIGITAL_ENDPOINT || '';
    const inicio = (
      lenhttps.length
      + bucket.length
      + endpoint.length);
    const fileDelete = file.substring(inicio, len);
    // eslint-disable-next-line no-await-in-loop
    await getStorage().deleteFile(fileDelete, {
      Bucket: process.env.S3_BUCKET,
    });

    const response = {
      message: 'Imagen eliminada exitosamente',
    };
    return res.status(200).send(response);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('ERROR', error);
    const responseError = {
      message: 'Something bad happened!',
      error: error.stack,
    };
    return res.status(500).send(JSON.stringify(responseError));
  }
};
