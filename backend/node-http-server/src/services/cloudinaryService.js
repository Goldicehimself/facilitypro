const cloudinary = require('../utils/cloudinary');

const defaultResourceTypeForMime = (mimetype) => {
  if (!mimetype) return 'raw';
  return mimetype.startsWith('image/') ? 'image' : 'raw';
};

const uploadLocalFile = async (fileOrPath, { folder, resourceType, type } = {}) => {
  const localPath = typeof fileOrPath === 'string' ? fileOrPath : fileOrPath.path;
  const mimetype = typeof fileOrPath === 'string' ? null : fileOrPath.mimetype;
  const resolvedResourceType = resourceType || defaultResourceTypeForMime(mimetype);

  const result = await cloudinary.uploader.upload(localPath, {
    folder,
    resource_type: resolvedResourceType,
    type
  });

  return { result, localPath };
};

const uploadBuffer = async (fileOrBuffer, { folder, resourceType, type } = {}) => {
  const buffer = Buffer.isBuffer(fileOrBuffer) ? fileOrBuffer : fileOrBuffer?.buffer;
  const mimetype = Buffer.isBuffer(fileOrBuffer) ? null : fileOrBuffer?.mimetype;
  if (!buffer) {
    throw new Error('Missing file buffer');
  }
  const resolvedResourceType = resourceType || defaultResourceTypeForMime(mimetype);

  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resolvedResourceType, type },
      (error, uploadResult) => {
        if (error) return reject(error);
        return resolve(uploadResult);
      }
    );
    stream.end(buffer);
  });

  return { result };
};

const getSignedUrl = (publicId, { resourceType = 'raw', expiresInSec = 600 } = {}) => {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSec;
  return cloudinary.url(publicId, {
    resource_type: resourceType,
    type: 'authenticated',
    sign_url: true,
    secure: true,
    expires_at: expiresAt
  });
};

module.exports = {
  defaultResourceTypeForMime,
  uploadLocalFile,
  uploadBuffer,
  getSignedUrl,
  safeUnlink: async () => {}
};
