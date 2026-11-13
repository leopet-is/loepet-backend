const LocalStorage = require('./LocalStorage');
const CloudinaryStorage = require('./CloudinaryStorage');

// El proveedor se resuelve por llamada (no al hacer require) para que
// los tests puedan fijar STORAGE_PROVIDER en cualquier momento.
const getStorage = () => {
  const provider = process.env.STORAGE_PROVIDER || 'local';
  const providers = {
    local: LocalStorage,
    cloudinary: CloudinaryStorage,
  };

  if (!providers[provider]) {
    throw new Error(`Storage provider not supported: ${provider}`);
  }

  return providers[provider];
};

const storage = {};
['updateFile', 'deleteFile'].forEach((method) => {
  storage[method] = (...args) => getStorage()[method](...args);
});

module.exports = storage;
