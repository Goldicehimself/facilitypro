const parseMultipartJson = (fields = []) => (req, res, next) => {
  if (!req.body || !fields.length) return next();

  fields.forEach((field) => {
    const value = req.body[field];
    if (typeof value !== 'string') return;
    const trimmed = value.trim();
    if (!trimmed || trimmed[0] !== '{') return;
    try {
      req.body[field] = JSON.parse(trimmed);
    } catch (error) {
      // ignore invalid JSON; validation will catch it
    }
  });

  next();
};

module.exports = { parseMultipartJson };
