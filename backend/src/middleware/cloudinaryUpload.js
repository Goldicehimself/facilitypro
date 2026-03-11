const { uploadBuffer, safeUnlink } = require('../services/cloudinaryService');

const buildCloudinaryMeta = (result) => ({
  publicId: result.public_id,
  resourceType: result.resource_type,
  format: result.format,
  bytes: result.bytes,
  url: result.secure_url
});

const uploadSingle = (folder, resourceType = null, uploadOptions = {}) => async (req, res, next) => {
  if (!req.file) return next();
  try {
    const { result } = await uploadBuffer(req.file, { folder, resourceType, ...uploadOptions });
    req.file.path = result.secure_url;
    req.file.cloudinary = buildCloudinaryMeta(result);
    return next();
  } catch (error) {
    return next(error);
  } finally {
    await safeUnlink();
  }
};

const uploadMultiple = (folder, resourceType = null, uploadOptions = {}) => async (req, res, next) => {
  if (!Array.isArray(req.files) || req.files.length === 0) return next();

  for (const file of req.files) {
    try {
      const { result } = await uploadBuffer(file, { folder, resourceType, ...uploadOptions });
      file.path = result.secure_url;
      file.cloudinary = buildCloudinaryMeta(result);
    } catch (error) {
      await safeUnlink();
      return next(error);
    }
    await safeUnlink();
  }

  return next();
};

module.exports = {
  uploadSingle,
  uploadMultiple
};
