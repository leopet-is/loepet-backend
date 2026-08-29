const storageProvider = process.env.STORAGE_PROVIDER || 'supabase';
const LocalStorage = require('./LocalStorage');
const SupabaseStorage = require('./SupabaseStorage');

const getStorage = () => {
  switch (storageProvider) {
    case 'local':
      return LocalStorage;
    case 'supabase':
    default:
      return SupabaseStorage;
  }
};

module.exports = getStorage();
