const aws = require('aws-sdk');
const multer = require('multer');
// eslint-disable-next-line import/no-unresolved
const multerS3 = require('multer-s3');

const { DIGITAL_ENDPOINT, DIGITAL_BUCKET } = process.env;

let s3 = null;
if (DIGITAL_ENDPOINT) {
  const spacesEndpoint = new aws.Endpoint(DIGITAL_ENDPOINT);
  s3 = new aws.S3({
    endpoint: spacesEndpoint,
  });
} else {
  // Mock s3 for multerS3 initialization when env vars are missing (e.g. in CI)
  s3 = {
    upload: () => ({ promise: () => Promise.reject(new Error('S3 not initialized')) }),
    deleteObject: () => ({ promise: () => Promise.reject(new Error('S3 not initialized')) }),
    listBuckets: () => ({ promise: () => Promise.reject(new Error('S3 not initialized')) }),
  };
}

const upload = multer({
  storage: multerS3({
    s3,
    bucket: DIGITAL_BUCKET,
    acl: 'public-read',
    metadata: (req, file, cb) => {
      cb(null, {
        fieldName: file.fieldname,
      });
    },
    key: (request, file, cb) => {
      console.log(file);
      cb(null, file.originalname);
    },
  }),
}).single('upload');

module.exports = { upload, s3 };
