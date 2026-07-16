const test = require('node:test');
const assert = require('node:assert/strict');
const { parseEnvironment, getImageExtension, toPublicData } = require('./validation');

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
