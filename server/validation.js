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

const validateBetInput = (input) => {
  if (typeof input.userId !== 'string' || input.userId.length === 0 || input.userId.length > 128) {
    return '请选择有效用户';
  }
  if (typeof input.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    return '请输入有效日期';
  }
  const parsedDate = new Date(`${input.date}T00:00:00.000Z`);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== input.date) {
    return '请输入有效日期';
  }
  if (typeof input.winAmount !== 'number' || !Number.isFinite(input.winAmount) || input.winAmount < 0 || input.winAmount > 1000000000) {
    return '中奖金额无效';
  }
  if (input.note !== undefined && (typeof input.note !== 'string' || input.note.length > 500)) {
    return '备注不能超过500个字符';
  }
  if (input.imageUrl !== undefined && (
    typeof input.imageUrl !== 'string'
    || input.imageUrl.length > 512
    || !input.imageUrl.startsWith('/uploads/bets/')
  )) {
    return '图片地址无效';
  }
  return null;
};

const mergeFootballConfig = (data, input) => ({
  ...data,
  apiKey: input.apiKey?.trim() || data.apiKey || '',
  competition: input.competition,
});

module.exports = {
  ENVIRONMENTS,
  parseEnvironment,
  getImageExtension,
  toPublicData,
  validateBetInput,
  mergeFootballConfig,
};
