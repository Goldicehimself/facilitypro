const multer = require('multer');
const memoryStorage = multer.memoryStorage();

const assetUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and JPG are allowed.'), false);
    }
    cb(null, true);
  }
});

// ========== AVATAR/PROFILE UPLOADS (Images only) ==========
const avatarUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and JPG are allowed.'), false);
    }
    cb(null, true);
  }
});

// ========== CERTIFICATE UPLOADS (PDF and Images) ==========
const certificateUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only JPEG, PNG, GIF, JPG, and PDF are allowed.'), false);
    }
    cb(null, true);
  }
});

// ========== DOCUMENT UPLOADS (PDF, Word, Excel, etc.) ==========
const documentUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
      'application/csv'
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only PDF, Word, Excel, and TXT are allowed.'), false);
    }
    cb(null, true);
  }
});

// ========== WORKORDER PHOTO UPLOADS (Images only) ==========
const workOrderPhotoUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and JPG are allowed.'), false);
    }
    cb(null, true);
  }
});

// ========== EXPORT HANDLERS ==========
module.exports = {
  // Asset uploads
  uploadAssetSingle: assetUpload.single('imageCover'),
  uploadAssetMultiple: assetUpload.array('images', 5),

  // Avatar uploads
  uploadAvatar: avatarUpload.single('avatar'),

  // Certificate uploads
  uploadCertificateSingle: certificateUpload.single('certificate'),
  uploadCertificateMultiple: certificateUpload.array('certificates', 10),

  // Document uploads
  uploadDocumentSingle: documentUpload.single('document'),
  uploadDocumentMultiple: documentUpload.array('documents', 5),
  uploadAssetImport: documentUpload.single('file'),

  // WorkOrder photo uploads
  uploadWorkOrderPhotoSingle: workOrderPhotoUpload.single('photo'),
  uploadWorkOrderPhotoMultiple: workOrderPhotoUpload.array('photos', 10)
};
