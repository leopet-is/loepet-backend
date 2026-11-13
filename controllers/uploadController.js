const fs = require('fs');
const storage = require('../services/storage');

exports.uploadFile = async (req, res) => {
  try {
    const { files } = req;

    if (!files || files.length === 0) {
      return res.status(400).send({
        message: 'No files provided',
      });
    }

    const fotos = await Promise.all(files.map(async (file) => {
      const { path: filePath, originalname: fileName } = file;
      try {
        return await storage.updateFile(fileName, filePath);
      } finally {
        fs.unlinkSync(filePath);
      }
    }));

    return res.status(200).send({
      message: 'Imagen subida exitosamente',
      fotos,
    });
  } catch (error) {
    console.log('ERROR', error);
    return res.status(500).send(JSON.stringify({
      message: 'Something bad happened!',
      error: error.stack,
    }));
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const { file } = req.body;
    if (typeof file !== 'string' || !file) {
      return res.status(400).send({ message: 'File URL is required' });
    }

    await storage.deleteFile(file);

    return res.status(200).send({
      message: 'Imagen eliminada exitosamente',
    });
  } catch (error) {
    console.log('ERROR', error);
    return res.status(500).send(JSON.stringify({
      message: 'Something bad happened!',
      error: error.stack,
    }));
  }
};
