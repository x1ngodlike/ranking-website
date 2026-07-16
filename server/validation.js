const ENVIRONMENTS = Object.freeze(['production', 'test']);
const ALLOWED_IMAGE_MIME_TYPES = Object.freeze({
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
});

const parseEnvironment = (value, fallback = 'production') => {
  if (value === undefined || value === null || value === '') return fallback;
  return typeof value === 'string' && ENVIRONMENTS.includes(value) ? value : null;
};

const getImageExtension = (mimeType) => ALLOWED_IMAGE_MIME_TYPES[mimeType] || null;

const toPublicData = (data) => {
  const { apiKey: _apiKey, ...publicData } = data || {};
  return publicData;
};

module.exports = {
  ENVIRONMENTS,
  parseEnvironment,
  getImageExtension,
  toPublicData,
};
