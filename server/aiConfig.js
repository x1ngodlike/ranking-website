const path = require('path');
const fs = require('fs');

const DEFAULT_AI_CONFIG = {
  apiEndpoint: 'https://api.deepseek.com/v1/chat/completions',
  apiKey: '',
  model: 'deepseek-v4-flash',
};

let aiConfigCache = null;
let aiConfigFile = null;

const initAIConfig = (dataDir) => {
  aiConfigFile = path.join(dataDir, 'ai-config.json');
  if (!aiConfigCache) {
    aiConfigCache = readAIConfig();
  }
};

const readAIConfig = () => {
  if (!fs.existsSync(aiConfigFile)) {
    return { ...DEFAULT_AI_CONFIG };
  }
  try {
    const raw = fs.readFileSync(aiConfigFile, 'utf-8');
    const data = JSON.parse(raw);
    return { ...DEFAULT_AI_CONFIG, ...data };
  } catch (e) {
    console.error('Failed to read AI config:', e);
    return { ...DEFAULT_AI_CONFIG };
  }
};

const getAIConfig = () => {
  if (!aiConfigCache) {
    aiConfigCache = readAIConfig();
  }
  return aiConfigCache;
};

const saveAIConfig = (config) => {
  aiConfigCache = { ...DEFAULT_AI_CONFIG, ...config };
  fs.writeFileSync(aiConfigFile, JSON.stringify(aiConfigCache, null, 2), 'utf-8');
  return aiConfigCache;
};

module.exports = {
  initAIConfig,
  getAIConfig,
  saveAIConfig,
};
