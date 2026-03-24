// Email Template Loader
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const resolveTemplateDir = (rawPath) => {
  if (!rawPath) return null;
  if (path.isAbsolute(rawPath)) {
    return rawPath;
  }

  const trimmed = rawPath.replace(/^([./\\])+/, '');
  const withoutBackendPrefix = trimmed.replace(/^backend[\\/]/, '');

  const candidates = [
    path.resolve(process.cwd(), rawPath),
    path.resolve(process.cwd(), trimmed),
    path.resolve(__dirname, '../../../', rawPath),
    path.resolve(__dirname, '../../../', trimmed),
    path.resolve(__dirname, '../../../', withoutBackendPrefix),
    path.resolve(__dirname, '../../../../', rawPath),
    path.resolve(__dirname, '../../../../', trimmed),
    path.resolve(__dirname, '../../../../', withoutBackendPrefix)
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) || candidates[0];
};

const getTemplatesDir = () => {
  if (process.env.EMAIL_TEMPLATES_DIR) {
    return resolveTemplateDir(process.env.EMAIL_TEMPLATES_DIR);
  }
  return path.resolve(__dirname, '../../../public/email-templates');
};

const loadTemplate = (filename) => {
  const templatePath = path.join(getTemplatesDir(), filename);
  return fs.readFileSync(templatePath, 'utf8');
};

const renderTemplate = (filename, data = {}) => {
  try {
    const html = loadTemplate(filename);
    return html.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key) => {
      const value = data[key];
      return value === undefined || value === null ? '' : String(value);
    });
  } catch (error) {
    logger.warn(`[email] failed to render template "${filename}": ${error.message}`);
    return null;
  }
};

module.exports = {
  renderTemplate,
  getTemplatesDir
};
