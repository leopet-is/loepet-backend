const crypto = require('crypto');
const cloudinary = require('../../services/storage/CloudinarySignature');

describe('Cloudinary signature', () => {
  const environment = {};
  const variableNames = [
    'CLOUDINARY_API_SECRET',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_CLOUD_NAME',
  ];

  beforeEach(() => {
    variableNames.forEach((name) => {
      environment[name] = process.env[name];
    });
    process.env.CLOUDINARY_API_SECRET = 'test-secret';
    process.env.CLOUDINARY_API_KEY = 'test-key';
    process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
  });

  afterEach(() => {
    variableNames.forEach((name) => {
      if (environment[name] === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = environment[name];
      }
    });
  });

  it('returns a signature matching Cloudinary signed-upload parameters', () => {
    const response = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };

    cloudinary.getCloudinarySignature({}, response);

    const [result] = response.json.mock.calls[0];
    const expectedSignature = crypto
      .createHash('sha1')
      .update(`folder=mascotas&timestamp=${result.timestamp}test-secret`)
      .digest('hex');

    expect(result).toEqual({
      signature: expectedSignature,
      timestamp: expect.any(Number),
      folder: 'mascotas',
      apiKey: 'test-key',
      cloudName: 'test-cloud',
    });
    expect(response.status).not.toHaveBeenCalled();
  });

  it('returns a service-unavailable response when Cloudinary credentials are missing', () => {
    delete process.env.CLOUDINARY_API_SECRET;
    const response = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };

    cloudinary.getCloudinarySignature({}, response);

    expect(response.status).toHaveBeenCalledWith(503);
    expect(response.json).toHaveBeenCalledWith({
      status: 'fail',
      message: 'El servicio de imágenes no está configurado',
    });
  });
});
