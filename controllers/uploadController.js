const fs = require('fs');
const path = require('path');
const storage = require('../services/storage');

exports.uploadFile = async (req, res) => {
  try {
    const { files } = req;

    if (!files || files.length === 0) {
      return res.status(400).send({
        message: 'No files provided',
      });
    }

    const fotos = [];
    for (const file of files) {
      const { path: filePath, originalname: fileName } = file;
      const location = await storage.updateFile(fileName, filePath);
      fotos.push(location);
      fs.unlinkSync(filePath);
    }

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
    const url = new URL(file);
    const filePath = url.pathname.split('/').pop();

    await storage.deleteFile(filePath);

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
