jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn(),
      destroy: jest.fn(),
    },
  },
}));

const cloudinary = require('cloudinary').v2;
const CloudinaryStorage = require('../../services/storage/CloudinaryStorage');
const storage = require('../../services/storage');

describe('CloudinaryStorage', () => {
  const env = {};
  let originalStorageProvider;
  const variableNames = [
    'CLOUDINARY_API_SECRET',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_CLOUD_NAME',
  ];

  beforeEach(() => {
    originalStorageProvider = process.env.STORAGE_PROVIDER;
    variableNames.forEach((name) => {
      env[name] = process.env[name];
    });
    process.env.CLOUDINARY_API_SECRET = 'test-secret';
    process.env.CLOUDINARY_API_KEY = 'test-key';
    process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (originalStorageProvider === undefined) {
      delete process.env.STORAGE_PROVIDER;
    } else {
      process.env.STORAGE_PROVIDER = originalStorageProvider;
    }

    variableNames.forEach((name) => {
      if (env[name] === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = env[name];
      }
    });
  });

  it('uploads files to the configured Cloudinary folder and returns the secure URL', async () => {
    cloudinary.uploader.upload.mockResolvedValue({
      secure_url: 'https://res.cloudinary.com/test-cloud/image/upload/v123/mascotas/foto.jpg',
    });

    const url = await CloudinaryStorage.updateFile('foto.jpg', 'tempFiles/file');

    expect(cloudinary.config).toHaveBeenCalledWith({
      cloud_name: 'test-cloud',
      api_key: 'test-key',
      api_secret: 'test-secret',
      secure: true,
    });
    expect(cloudinary.uploader.upload).toHaveBeenCalledWith('tempFiles/file', {
      folder: 'mascotas',
      resource_type: 'auto',
      use_filename: true,
      unique_filename: true,
      filename_override: 'foto.jpg',
    });
    expect(url).toBe('https://res.cloudinary.com/test-cloud/image/upload/v123/mascotas/foto.jpg');
  });

  it('selects Cloudinary when STORAGE_PROVIDER is cloudinary', async () => {
    process.env.STORAGE_PROVIDER = 'cloudinary';
    cloudinary.uploader.upload.mockResolvedValue({
      secure_url: 'https://res.cloudinary.com/test-cloud/image/upload/v123/mascotas/foto.jpg',
    });

    await expect(storage.updateFile('foto.jpg', 'tempFiles/file')).resolves.toContain('res.cloudinary.com');

    expect(cloudinary.uploader.upload).toHaveBeenCalled();
  });

  it('deletes an uploaded image by public ID', async () => {
    cloudinary.uploader.destroy.mockResolvedValue({ result: 'ok' });

    await expect(CloudinaryStorage.deleteFile(
      'https://res.cloudinary.com/test-cloud/image/upload/v123/mascotas/foto.jpg',
    )).resolves.toEqual({ success: true });

    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
      'mascotas/foto',
      { resource_type: 'image' },
    );
  });

  it('preserves the extension and resource type when deleting raw files', async () => {
    cloudinary.uploader.destroy.mockResolvedValue({ result: 'ok' });

    await CloudinaryStorage.deleteFile(
      'https://res.cloudinary.com/test-cloud/raw/upload/v123/mascotas/documento.pdf',
    );

    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
      'mascotas/documento.pdf',
      { resource_type: 'raw' },
    );
  });

  it('rejects URLs that do not belong to the configured Cloudinary account', async () => {
    await expect(CloudinaryStorage.deleteFile(
      'https://res.cloudinary.com/other-cloud/image/upload/v123/mascotas/foto.jpg',
    )).rejects.toThrow('La URL no pertenece al almacenamiento de Cloudinary configurado.');
    expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
  });

  it('requires Cloudinary credentials before uploading', async () => {
    delete process.env.CLOUDINARY_API_SECRET;

    await expect(CloudinaryStorage.updateFile('foto.jpg', 'tempFiles/file'))
      .rejects.toThrow('Cloudinary no está configurado.');
    expect(cloudinary.uploader.upload).not.toHaveBeenCalled();
  });
});
