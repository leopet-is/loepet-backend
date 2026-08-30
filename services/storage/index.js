const LocalStorage = require('./LocalStorage');
const SupabaseStorage = require('./SupabaseStorage');

// El proveedor se resuelve por llamada (no al hacer require) para que
// los tests puedan fijar STORAGE_PROVIDER en cualquier momento.
const getStorage = () => {
  const provider = process.env.STORAGE_PROVIDER || 'supabase';
  return provider === 'local' ? LocalStorage : SupabaseStorage;
};

const storage = {};
['updateFile', 'deleteFile'].forEach((method) => {
  storage[method] = (...args) => getStorage()[method](...args);
});

module.exports = storage;
