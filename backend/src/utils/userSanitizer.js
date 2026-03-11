const isLegacyUploadPath = (value) =>
  typeof value === 'string' && (value.startsWith('uploads/') || value.includes('/uploads/'));

const sanitizeAvatarValue = (value) => (isLegacyUploadPath(value) ? null : value);

const sanitizeUserObject = (user) => {
  if (!user || typeof user !== 'object') return user;
  return { ...user, avatar: sanitizeAvatarValue(user.avatar) };
};

module.exports = {
  isLegacyUploadPath,
  sanitizeAvatarValue,
  sanitizeUserObject
};
