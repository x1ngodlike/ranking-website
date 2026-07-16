const test = require('node:test');
const assert = require('node:assert/strict');
const {
  parseEnvironment,
  getImageExtension,
  toPublicData,
  validateBetInput,
  mergeFootballConfig,
} = require('./validation');

test('environment accepts only supported values', () => {
  assert.equal(parseEnvironment('production'), 'production');
  assert.equal(parseEnvironment('test'), 'test');
  assert.equal(parseEnvironment(undefined), 'production');
  assert.equal(parseEnvironment('../outside'), null);
  assert.equal(parseEnvironment(['production']), null);
});

test('uploads accept only raster image formats', () => {
  assert.equal(getImageExtension('image/jpeg'), '.jpg');
  assert.equal(getImageExtension('image/png'), '.png');
  assert.equal(getImageExtension('image/webp'), '.webp');
  assert.equal(getImageExtension('image/svg+xml'), null);
  assert.equal(getImageExtension('text/html'), null);
});

test('public data never exposes the football API key', () => {
  const publicData = toPublicData({ users: [], bets: [], apiKey: 'secret', competition: 'WC' });
  assert.deepEqual(publicData, { users: [], bets: [], competition: 'WC' });
  assert.equal('apiKey' in publicData, false);
});

test('public bet creation accepts only bounded, valid input', () => {
  assert.equal(validateBetInput({
    userId: 'user-1',
    date: '2026-07-16',
    winAmount: 0,
    note: '未中奖',
    imageUrl: '/uploads/bets/example.jpg',
  }), null);
  assert.equal(validateBetInput({ userId: 'user-1', date: '2026-02-31', winAmount: 1 }), '请输入有效日期');
  assert.equal(validateBetInput({ userId: 'user-1', date: '2026-07-16', winAmount: -1 }), '中奖金额无效');
  assert.equal(validateBetInput({ userId: 'user-1', date: '2026-07-16', winAmount: 1, imageUrl: 'https://example.com/x.jpg' }), '图片地址无效');
});

test('saving football settings preserves an existing key when input is blank', () => {
  const existing = { users: [], bets: [], apiKey: 'existing-secret', competition: 'WC' };
  assert.deepEqual(
    mergeFootballConfig(existing, { apiKey: '', competition: '2000' }),
    { ...existing, apiKey: 'existing-secret', competition: '2000' }
  );
});
