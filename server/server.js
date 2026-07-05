const express = require('express');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { syncMatches, hasLiveMatches } = require('./matchSync');
const { initAIConfig, getAIConfig, saveAIConfig } = require('./aiConfig');
const { recognizeBetImage } = require('./aiRecognition');
const { initNewsService, fetchAllNews, getAllNews, getNewsForTeams } = require('./footballNews');
const { predictMatches, getPredictionHistory, getLatestPrediction, updatePredictionResults } = require('./aiPrediction');

const app = express();
const PORT = process.env.PORT || 3001;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
const AVATAR_DIR = path.join(UPLOAD_DIR, 'avatars');
const BET_DIR = path.join(UPLOAD_DIR, 'bets');
const DIST_DIR = process.env.DIST_DIR || path.join(__dirname, '..', 'dist');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '159357';
const AUTO_BACKUP_INTERVAL_MS = parseInt(process.env.AUTO_BACKUP_INTERVAL_MS || '900000', 10);
const MAX_BACKUPS = parseInt(process.env.MAX_BACKUPS || '50', 10);

const TOKEN_TTL = 24 * 60 * 60 * 1000;
const JSON_INDENT = 2;
const AVATAR_MAX_SIZE = 5 * 1024 * 1024;
const BET_IMAGE_MAX_SIZE = 10 * 1024 * 1024;
const FOOTBALL_API_BASE = 'https://api.football-data.org/v4/';
const ENVIRONMENTS = ['production', 'test'];

let adminTokens = new Set();

const generateToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  adminTokens.add(token);
  setTimeout(() => adminTokens.delete(token), TOKEN_TTL);
  return token;
};

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (token && adminTokens.has(token)) {
    return next();
  }
  res.status(401).json({ success: false, message: '未授权，请先登录' });
};

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

const REQUIRED_DIRS = [DATA_DIR, UPLOAD_DIR, AVATAR_DIR, BET_DIR, BACKUP_DIR];
REQUIRED_DIRS.forEach(ensureDir);

const AUTH_FILE = path.join(DATA_DIR, 'auth.json');
const getEnvDir = (env) => path.join(DATA_DIR, env);
const getDataFile = (env) => path.join(getEnvDir(env), 'data.json');
const getMatchesFile = (env) => path.join(getEnvDir(env), 'matches.json');
const getBackupDir = (env) => path.join(BACKUP_DIR, env);

const ensureEnvDir = (env) => ensureDir(getEnvDir(env));
const ensureBackupDir = (env) => ensureDir(getBackupDir(env));

const readJsonFile = (file, defaultValue) => {
  if (!fs.existsSync(file)) {
    return defaultValue;
  }
  try {
    const raw = fs.readFileSync(file, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read JSON file:', file, e);
    return defaultValue;
  }
};

const writeJsonFile = (file, data) => {
  fs.writeFileSync(file, JSON.stringify(data, null, JSON_INDENT), 'utf-8');
};

const splitDataAndMatches = (oldData) => {
  const { matches, ...dataOnly } = oldData;
  return { data: dataOnly, matches: matches || [] };
};

const migrateDataFiles = () => {
  ENVIRONMENTS.forEach((env) => {
    const oldDataFile = path.join(DATA_DIR, `data-${env}.json`);
    const oldMatchesFile = path.join(DATA_DIR, `matches-${env}.json`);
    const legacyDataFile = path.join(DATA_DIR, 'data.json');
    ensureEnvDir(env);
    const newDataFile = getDataFile(env);
    const newMatchesFile = getMatchesFile(env);

    if (fs.existsSync(oldDataFile) && !fs.existsSync(newDataFile)) {
      try {
        const oldData = readJsonFile(oldDataFile, {});
        const { data, matches } = splitDataAndMatches(oldData);
        writeJsonFile(newDataFile, data);
        if (matches.length > 0 && !fs.existsSync(newMatchesFile)) {
          writeJsonFile(newMatchesFile, matches);
        }
        fs.unlinkSync(oldDataFile);
        console.log(`Migrated data-${env}.json to ${env}/data.json (matches split)`);
      } catch (e) {
        console.error(`Failed to migrate data-${env}.json:`, e);
      }
    }
    if (fs.existsSync(oldMatchesFile) && !fs.existsSync(newMatchesFile)) {
      try {
        fs.renameSync(oldMatchesFile, newMatchesFile);
        console.log(`Migrated matches-${env}.json to ${env}/matches.json`);
      } catch (e) {
        console.error(`Failed to migrate matches-${env}.json:`, e);
      }
    }
    if (env === 'production' && fs.existsSync(legacyDataFile) && !fs.existsSync(newDataFile)) {
      try {
        const legacyData = readJsonFile(legacyDataFile, {});
        const { data, matches } = splitDataAndMatches(legacyData);
        writeJsonFile(newDataFile, data);
        if (matches.length > 0 && !fs.existsSync(newMatchesFile)) {
          writeJsonFile(newMatchesFile, matches);
        }
        console.log('Migrated legacy data.json to production/');
      } catch (e) {
        console.error('Failed to migrate legacy data.json:', e);
      }
    }
  });
};
migrateDataFiles();

initAIConfig(DATA_DIR);

const createMulterStorage = (destination) => multer.diskStorage({
  destination: (req, file, cb) => cb(null, destination),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const createImageFilter = () => (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({
  storage: createMulterStorage(AVATAR_DIR),
  limits: { fileSize: AVATAR_MAX_SIZE },
  fileFilter: createImageFilter(),
});

const uploadBet = multer({
  storage: createMulterStorage(BET_DIR),
  limits: { fileSize: BET_IMAGE_MAX_SIZE },
  fileFilter: createImageFilter(),
});

const getDefaultData = () => ({
  users: [],
  bets: [],
  apiKey: '',
  competition: 'WC',
  currentUserId: null,
});

const readData = (env = 'production') => readJsonFile(getDataFile(env), getDefaultData());

const writeData = (env, data) => {
  ensureEnvDir(env);
  const dataToSave = {
    users: data.users || [],
    bets: data.bets || [],
    apiKey: data.apiKey || '',
    competition: data.competition || 'WC',
    currentUserId: data.currentUserId || null,
  };
  writeJsonFile(getDataFile(env), dataToSave);
};

const getWinner = (match) => {
  if (match.status !== 'finished' || match.homeScore === null || match.awayScore === null) return null;
  if (match.homeScore > match.awayScore) return match.homeTeam;
  if (match.awayScore > match.homeScore) return match.awayTeam;
  if (match.homePenaltyScore !== null && match.awayPenaltyScore !== null) {
    if (match.homePenaltyScore > match.awayPenaltyScore) return match.homeTeam;
    if (match.awayPenaltyScore > match.homePenaltyScore) return match.awayTeam;
  }
  return null;
};

const getWinnerFlag = (match) => {
  const winner = getWinner(match);
  if (!winner) return null;
  if (winner === match.homeTeam) return match.homeFlag;
  return match.awayFlag;
};

const sortKnockoutMatches = (matches) => {
  const roundOrder = {
    'round_of_32': 1,
    'round_of_16': 2,
    'quarter_final': 3,
    'semi_final': 4,
    'final': 5,
    'third_place': 6,
  };
  
  const roundOf32 = matches.filter(m => m.roundKey === 'round_of_32');
  const roundOf16 = matches.filter(m => m.roundKey === 'round_of_16');
  const quarterFinals = matches.filter(m => m.roundKey === 'quarter_final');
  const semiFinals = matches.filter(m => m.roundKey === 'semi_final');
  const finalMatch = matches.filter(m => m.roundKey === 'final');
  const thirdPlace = matches.filter(m => m.roundKey === 'third_place');
  
  const teamToMatch32 = new Map();
  roundOf32.forEach(match => {
    if (match.homeTeam && match.homeTeam !== '待定') {
      teamToMatch32.set(match.homeTeam, match);
    }
    if (match.awayTeam && match.awayTeam !== '待定') {
      teamToMatch32.set(match.awayTeam, match);
    }
  });
  
  const sorted32 = [];
  const usedIds32 = new Set();
  
  const order32 = [
    ['德国', '巴拉圭'],
    ['法国', '瑞典'],
    ['南非', '加拿大'],
    ['荷兰', '摩洛哥'],
    ['葡萄牙', '克罗地亚'],
    ['西班牙', '奥地利'],
    ['美国', '波黑'],
    ['比利时', '塞内加尔'],
    ['巴西', '日本'],
    ['科特迪瓦', '挪威'],
    ['墨西哥', '厄瓜多尔'],
    ['英格兰', '刚果(金)'],
    ['阿根廷', '佛得角'],
    ['澳大利亚', '埃及'],
    ['瑞士', '阿尔及利亚'],
    ['哥伦比亚', '加纳'],
  ];
  
  order32.forEach(pair => {
    const [team1, team2] = pair;
    const match = teamToMatch32.get(team1) || teamToMatch32.get(team2);
    if (match && !usedIds32.has(match.id)) {
      sorted32.push(match);
      usedIds32.add(match.id);
    }
  });
  
  roundOf32.forEach(match => {
    if (!usedIds32.has(match.id)) {
      sorted32.push(match);
      usedIds32.add(match.id);
    }
  });
  
  const sorted16 = [];
  const usedIds16 = new Set();
  
  const order16 = [
    ['巴拉圭', '法国'],
    ['加拿大', '摩洛哥'],
    ['葡萄牙', '西班牙'],
    ['美国', '比利时'],
    ['巴西', '挪威'],
    ['墨西哥', '英格兰'],
    ['阿根廷', '澳大利亚'],
    ['瑞士', '哥伦比亚'],
  ];
  
  const pendingMatches = roundOf16.filter(m => 
    (!m.homeTeam || m.homeTeam === 'None' || m.homeTeam === '待定') && 
    (!m.awayTeam || m.awayTeam === 'None' || m.awayTeam === '待定')
  );
  
  let pendingIdx = 0;
  
  order16.forEach(pair => {
    const [team1, team2] = pair;
    
    let match = roundOf16.find(m => 
      !usedIds16.has(m.id) &&
      ((m.homeTeam === team1 || m.awayTeam === team1) ||
       (m.homeTeam === team2 || m.awayTeam === team2))
    );
    
    if (!match && pendingIdx < pendingMatches.length) {
      match = pendingMatches[pendingIdx];
      pendingIdx++;
    }
    
    if (!match) {
      const unusedOthers = roundOf16.filter(m => 
        !usedIds16.has(m.id) &&
        !((m.homeTeam === 'None' || m.homeTeam === '待定') && 
          (m.awayTeam === 'None' || m.awayTeam === '待定'))
      );
      if (unusedOthers.length > 0) {
        match = unusedOthers[0];
      }
    }
    
    if (match) {
      sorted16.push(match);
      usedIds16.add(match.id);
    }
  });
  
  // 根据上一轮已结束的比赛，推断下一轮的待定对阵
  const inferNextRound = (currentRoundSorted, nextRoundSorted, fixedOrder) => {
    nextRoundSorted.forEach((nextMatch, idx) => {
      if (idx >= currentRoundSorted.length / 2) return;
      
      const match1 = currentRoundSorted[idx * 2];
      const match2 = currentRoundSorted[idx * 2 + 1];
      if (!match1 || !match2) return;
      
      const winner1 = getWinner(match1);
      const winner2 = getWinner(match2);
      const flag1 = getWinnerFlag(match1);
      const flag2 = getWinnerFlag(match2);
      
      const needsHomeInfer = !nextMatch.homeTeam || nextMatch.homeTeam === 'None' || nextMatch.homeTeam === '待定';
      const needsAwayInfer = !nextMatch.awayTeam || nextMatch.awayTeam === 'None' || nextMatch.awayTeam === '待定';
      
      if (winner1 && needsHomeInfer) {
        nextMatch.homeTeam = winner1;
        nextMatch.homeFlag = flag1 || nextMatch.homeFlag;
      }
      if (winner2 && needsAwayInfer) {
        nextMatch.awayTeam = winner2;
        nextMatch.awayFlag = flag2 || nextMatch.awayFlag;
      }
    });
  };
  
  // 1/16 → 1/8
  inferNextRound(sorted32, sorted16, order16);
  
  // 1/8 → 1/4
  const sortedQF = [...quarterFinals].sort((a, b) => {
    const idA = parseInt(a.id.replace('api_', '') || '0', 10);
    const idB = parseInt(b.id.replace('api_', '') || '0', 10);
    return idA - idB;
  });
  inferNextRound(sorted16, sortedQF);
  
  // 1/4 → 半决赛
  const sortedSF = [...semiFinals].sort((a, b) => {
    const idA = parseInt(a.id.replace('api_', '') || '0', 10);
    const idB = parseInt(b.id.replace('api_', '') || '0', 10);
    return idA - idB;
  });
  inferNextRound(sortedQF, sortedSF);
  
  // 半决赛 → 决赛
  const sortedFinal = [...finalMatch];
  inferNextRound(sortedSF, sortedFinal);
  
  return [...matches].sort((a, b) => {
    if (a.stage === 'knockout' && b.stage === 'knockout') {
      if (a.roundKey === 'round_of_32' && b.roundKey === 'round_of_32') {
        const idxA = sorted32.findIndex(m => m.id === a.id);
        const idxB = sorted32.findIndex(m => m.id === b.id);
        return idxA - idxB;
      }
      if (a.roundKey === 'round_of_16' && b.roundKey === 'round_of_16') {
        const idxA = sorted16.findIndex(m => m.id === a.id);
        const idxB = sorted16.findIndex(m => m.id === b.id);
        return idxA - idxB;
      }
      const orderA = roundOrder[a.roundKey] || 1;
      const orderB = roundOrder[b.roundKey] || 1;
      if (orderA !== orderB) return orderA - orderB;
      const idA = parseInt(a.id.replace('api_', '') || '0', 10);
      const idB = parseInt(b.id.replace('api_', '') || '0', 10);
      return idA - idB;
    }
    return new Date(a.matchTime).getTime() - new Date(b.matchTime).getTime();
  });
};

const readMatches = (env = 'production') => {
  const matches = readJsonFile(getMatchesFile(env), []);
  return sortKnockoutMatches(matches);
};

const writeMatches = (env, matches) => {
  ensureEnvDir(env);
  writeJsonFile(getMatchesFile(env), matches);
};

const readAuth = () => {
  if (!fs.existsSync(AUTH_FILE)) {
    const hash = bcrypt.hashSync(DEFAULT_ADMIN_PASSWORD, 10);
    const auth = { adminPasswordHash: hash };
    writeJsonFile(AUTH_FILE, auth);
    return auth;
  }
  return readJsonFile(AUTH_FILE, { adminPasswordHash: bcrypt.hashSync(DEFAULT_ADMIN_PASSWORD, 10) });
};

const writeAuth = (auth) => {
  writeJsonFile(AUTH_FILE, auth);
};

const createBackup = (env, label = 'manual') => {
  const dir = ensureBackupDir(env);
  const data = readData(env);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${timestamp}-${label}.json`;
  const filepath = path.join(dir, filename);

  const backupContent = {
    version: 1,
    environment: env,
    createdAt: new Date().toISOString(),
    label,
    data,
  };

  writeJsonFile(filepath, backupContent);
  cleanOldBackups(env);

  return { filename, createdAt: backupContent.createdAt, label, size: fs.statSync(filepath).size };
};

const listBackups = (env) => {
  const dir = getBackupDir(env);
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  return files
    .map((f) => {
      const filepath = path.join(dir, f);
      const stat = fs.statSync(filepath);
      let meta = { createdAt: stat.mtime.toISOString(), label: 'unknown' };
      try {
        const content = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
        meta.createdAt = content.createdAt || meta.createdAt;
        meta.label = content.label || meta.label;
      } catch (e) {
        // ignore parse errors, use file stats fallback
      }
      return {
        filename: f,
        size: stat.size,
        createdAt: meta.createdAt,
        label: meta.label,
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const cleanOldBackups = (env) => {
  const backups = listBackups(env);
  const autoBackups = backups.filter(b => b.label === 'auto');
  if (autoBackups.length > MAX_BACKUPS) {
    const toDelete = autoBackups.slice(MAX_BACKUPS);
    const dir = getBackupDir(env);
    toDelete.forEach((b) => {
      try {
        fs.unlinkSync(path.join(dir, b.filename));
      } catch (e) {
        console.error('Failed to delete old backup:', b.filename, e);
      }
    });
  }
};

const resolveBackupPath = (env, filename) => {
  const dir = getBackupDir(env);
  const filepath = path.join(dir, filename);
  const resolved = path.resolve(filepath);
  if (!resolved.startsWith(path.resolve(dir))) {
    throw new Error('非法的备份文件路径');
  }
  return filepath;
};

const deleteBackup = (env, filename) => {
  const filepath = resolveBackupPath(env, filename);
  if (!fs.existsSync(filepath)) return false;
  fs.unlinkSync(filepath);
  return true;
};

const restoreBackup = (env, filename) => {
  const filepath = resolveBackupPath(env, filename);
  if (!fs.existsSync(filepath)) {
    throw new Error('备份文件不存在');
  }
  const content = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  if (!content.data) {
    throw new Error('备份文件格式错误');
  }
  writeData(env, content.data);
  return content.data;
};

const proxyFootballApi = async (req, res, method = 'GET') => {
  const apiKey = req.query.apiKey || '';
  const targetPath = req.params.path;
  const targetUrl = `${FOOTBALL_API_BASE}${targetPath}`;

  const maxRetries = 2;
  const timeoutMs = 15000;

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const fetchWithTimeout = async (url, options, timeout) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      return response;
    } finally {
      clearTimeout(id);
    }
  };

  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const fetchOptions = {
        method,
        headers: {
          'X-Auth-Token': apiKey,
          'Content-Type': 'application/json',
          'Accept-Encoding': 'gzip, deflate'
        }
      };
      if (method === 'POST') {
        fetchOptions.body = JSON.stringify(req.body);
      }

      const response = await fetchWithTimeout(targetUrl, fetchOptions, timeoutMs);

      const rateLimitHeaders = {};
      ['x-requests-available', 'x-requests-limit', 'x-requests-reset'].forEach(h => {
        const value = response.headers.get(h);
        if (value) rateLimitHeaders[h] = value;
      });

      const contentType = response.headers.get('content-type') || '';
      let data;
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = { message: await response.text() };
      }

      if (response.status === 429) {
        const resetTime = response.headers.get('x-requests-reset') || '';
        const resetDate = resetTime ? new Date(parseInt(resetTime) * 1000).toLocaleString('zh-CN') : '';
        console.warn(`Football API rate limited (attempt ${attempt + 1}/${maxRetries + 1}), reset at ${resetDate}`);
        if (attempt < maxRetries) {
          const waitMs = Math.min(5000 * (attempt + 1), 15000);
          await delay(waitMs);
          continue;
        }
        return res.status(429).json({
          message: `请求过于频繁，请稍后再试${resetDate ? '，将于 ' + resetDate + ' 重置' : ''}`,
          ...rateLimitHeaders
        });
      }

      if (!response.ok) {
        console.warn(`Football API error: ${response.status} - ${targetPath}`);
        if (attempt < maxRetries && (response.status >= 500 || response.status === 408)) {
          const waitMs = 1000 * (attempt + 1);
          await delay(waitMs);
          continue;
        }
      }

      return res.status(response.status).json({ ...data, ...rateLimitHeaders });

    } catch (error) {
      lastError = error;
      console.error(`Football API proxy error (attempt ${attempt + 1}/${maxRetries + 1}):`, error.message);

      if (error.name === 'AbortError') {
        if (attempt < maxRetries) {
          await delay(2000 * (attempt + 1));
          continue;
        }
        return res.status(504).json({ message: '请求超时，请稍后重试' });
      }

      if (attempt < maxRetries) {
        await delay(2000 * (attempt + 1));
        continue;
      }
    }
  }

  console.error('Football API all attempts failed:', lastError?.message);
  res.status(502).json({ message: '请求失败，请稍后重试' });
};

const handleError = (res, error, defaultMessage) => {
  console.error(defaultMessage + ':', error);
  res.status(500).json({ success: false, message: error.message || defaultMessage });
};

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(UPLOAD_DIR));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/data', (req, res) => {
  const environment = req.query.environment || 'production';
  const data = readData(environment);
  const matches = readMatches(environment);
  res.json({ ...data, matches, environment });
});

app.post('/api/data', (req, res) => {
  const { environment = 'production', matches, ...data } = req.body;
  writeData(environment, data);
  if (matches) {
    writeMatches(environment, matches);
  }
  res.json({ success: true });
});

app.get('/api/matches', (req, res) => {
  const environment = req.query.environment || 'production';
  const matches = readMatches(environment);
  res.json({ matches, environment });
});

app.post('/api/matches', (req, res) => {
  const { environment = 'production', matches } = req.body;
  if (matches) {
    writeMatches(environment, matches);
  }
  res.json({ success: true });
});

// 手动触发赛程同步
app.post('/api/matches/sync', async (req, res) => {
  const environment = req.query.environment || 'production';
  const data = readData(environment);
  const apiKey = data.apiKey;
  const competition = data.competition || '2000';

  if (!apiKey) {
    return res.status(400).json({ success: false, message: '请先配置 API Key' });
  }

  const result = await syncMatches(apiKey, competition);
  if (result.success) {
    writeMatches(environment, result.matches);
    // 同步成功后重新调度定时器
    scheduleNextMatchSync(result.matches);
    res.json({
      success: true,
      count: result.matches.length,
      liveCount: result.matches.filter(m => m.status === 'live').length,
    });
  } else {
    const errorMessages = {
      no_api_key: '请先配置 API Key',
      timeout: '请求超时，请稍后重试',
      network_error: '网络错误，请稍后重试',
      invalid_response: 'API 返回数据格式错误',
    };
    res.status(500).json({
      success: false,
      message: errorMessages[result.reason] || `同步失败: ${result.reason}`,
    });
  }
});

// ========== 成就徽章系统 ==========

// 徽章配置
const BADGE_DEFINITIONS = [
  // 单日爆发类
  { id: 'meierduka', name: '梅开二度', condition: { type: 'dailyWins', value: 2 }, rarity: 3 },
  { id: 'maozixifa', name: '帽子戏法', condition: { type: 'dailyWins', value: 3 }, rarity: 4 },
  { id: 'sixilinmen', name: '四喜临门', condition: { type: 'dailyWins', value: 4 }, rarity: 5 },
  // 累计盈利类
  { id: 'xiaoyouhuoshou', name: '小有收获', condition: { type: 'totalProfit', value: 200 }, rarity: 1 },
  { id: 'caiyuanggungun', name: '财源滚滚', condition: { type: 'totalProfit', value: 1000 }, rarity: 2 },
  { id: 'jinkubazhu', name: '金库霸主', condition: { type: 'totalProfit', value: 2000 }, rarity: 3 },
  { id: 'rijindoujin', name: '日进斗金', condition: { type: 'totalProfit', value: 5000 }, rarity: 4 },
  { id: 'yiwanfuweng', name: '亿万富翁', condition: { type: 'totalProfit', value: 10000 }, rarity: 5 },
  // 累计次数类
  { id: 'kaimenhong', name: '开门红', condition: { type: 'totalWins', value: 1 }, rarity: 1 },
  { id: 'shinaojiuwen', name: '十拿九稳', condition: { type: 'totalWins', value: 10 }, rarity: 3 },
  { id: 'baizhanbaisheng', name: '百战百胜', condition: { type: 'totalWins', value: 20 }, rarity: 5 },
  // 特殊里程碑类
  { id: 'jijunsaiyuyanjia', name: '季军赛预言家', condition: { type: 'milestoneDate', value: '2026-07-19' }, rarity: 2 },
  { id: 'juesaiyuyanjia', name: '决赛预言家', condition: { type: 'milestoneDate', value: '2026-07-20' }, rarity: 5 },
  // 单日盈利类
  { id: 'yiyebaofu', name: '一夜暴富', condition: { type: 'dailyProfit', value: 500 }, rarity: 3 },
  { id: 'caishenjianglin', name: '财神降临', condition: { type: 'dailyProfit', value: 2000 }, rarity: 4 },
  { id: 'fuguizaitian', name: '富贵在天', condition: { type: 'dailyProfit', value: 5000 }, rarity: 5 },
];

// 计算用户成就徽章
app.get('/api/badges/:userId', (req, res) => {
  const environment = req.query.environment || 'production';
  const userId = req.params.userId;
  const data = readData(environment);

  // 获取用户的所有中奖记录
  const userBets = (data.bets || []).filter(b => b.userId === userId);

  // 计算各项统计数据
  const winBets = userBets.filter(b => (b.winAmount || 0) > 0);
  const totalProfit = winBets.reduce((sum, b) => sum + (b.winAmount || 0), 0);
  const totalWins = winBets.length;

  // 按日期分组
  const dailyStats = {};
  userBets.forEach(bet => {
    const date = bet.date || (bet.createdAt ? bet.createdAt.substring(0, 10) : 'unknown');
    if (!dailyStats[date]) {
      dailyStats[date] = { wins: 0, profit: 0 };
    }
    if ((bet.winAmount || 0) > 0) {
      dailyStats[date].wins += 1;
      dailyStats[date].profit += bet.winAmount || 0;
    }
  });

  // 计算最大单日中奖次数和最大单日盈利
  const maxDailyWins = Math.max(0, ...Object.values(dailyStats).map(d => d.wins));
  const maxDailyProfit = Math.max(0, ...Object.values(dailyStats).map(d => d.profit));

  // 检查特殊日期是否有中奖
  const milestoneDates = {
    '2026-06-15': dailyStats['2026-06-15']?.wins > 0,
    '2026-07-19': dailyStats['2026-07-19']?.wins > 0,
  };

  // 计算已获得的徽章
  const earnedBadges = BADGE_DEFINITIONS.filter(badge => {
    const { type, value } = badge.condition;
    switch (type) {
      case 'dailyWins':
        return maxDailyWins >= value;
      case 'totalProfit':
        return totalProfit >= value;
      case 'totalWins':
        return totalWins >= value;
      case 'milestoneDate':
        return milestoneDates[value] === true;
      case 'dailyProfit':
        return maxDailyProfit >= value;
      default:
        return false;
    }
  });

  // 返回结果
  res.json({
    success: true,
    userId,
    badges: earnedBadges.map(b => ({
      id: b.id,
      name: b.name,
      rarity: b.rarity,
      earnedAt: new Date().toISOString(), // 简化处理，实际可记录首次获得时间
    })),
    stats: {
      totalProfit,
      totalWins,
      maxDailyWins,
      maxDailyProfit,
    },
  });
});

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const auth = readAuth();
  const valid = bcrypt.compareSync(password, auth.adminPasswordHash);
  if (valid) {
    const token = generateToken();
    res.json({ success: true, token });
  } else {
    res.status(401).json({ success: false, message: '密码错误' });
  }
});

app.post('/api/admin/logout', requireAuth, (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (token) adminTokens.delete(token);
  res.json({ success: true });
});

app.get('/api/ai-config', requireAuth, (req, res) => {
  const config = getAIConfig();
  res.json({ success: true, config });
});

app.post('/api/ai-config', requireAuth, (req, res) => {
  const { apiEndpoint, apiKey, model, siteUrl } = req.body;
  const config = saveAIConfig({
    apiEndpoint: apiEndpoint || 'https://api.deepseek.com/v1/chat/completions',
    apiKey: apiKey || '',
    model: model || 'gpt-4o-mini',
    siteUrl: siteUrl || '',
  });
  res.json({ success: true, config });
});

app.post('/api/admin/password', requireAuth, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const auth = readAuth();
  const valid = bcrypt.compareSync(oldPassword, auth.adminPasswordHash);
  if (!valid) {
    return res.status(401).json({ success: false, message: '原密码错误' });
  }
  auth.adminPasswordHash = bcrypt.hashSync(newPassword, 10);
  writeAuth(auth);
  res.json({ success: true });
});

app.post('/api/upload/avatar', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  const url = `/uploads/avatars/${req.file.filename}`;
  res.json({ success: true, url });
});

app.post('/api/upload/bet', uploadBet.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  const url = `/uploads/bets/${req.file.filename}`;
  res.json({ success: true, url });
});

app.post('/api/ai/recognize', async (req, res) => {
  try {
    const { imageUrl, winAmount } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ success: false, message: '缺少图片URL' });
    }

    const aiConfig = getAIConfig();
    if (!aiConfig.apiKey) {
      return res.status(400).json({ success: false, message: 'AI API密钥未配置' });
    }

    const imagePath = path.join(UPLOAD_DIR, imageUrl.replace(/^\/uploads\//, ''));
    if (!fs.existsSync(imagePath)) {
      return res.status(400).json({ success: false, message: '图片文件不存在' });
    }

    const result = await recognizeBetImage(imagePath, imageUrl, aiConfig, readMatches(), winAmount, getAllNews());
    if (!result) {
      return res.json({ success: true, result: null, message: '未能识别出比赛信息' });
    }

    res.json({ success: true, result });
  } catch (error) {
    console.error('AI识别错误:', error);
    res.status(500).json({ success: false, message: error.message || 'AI识别失败' });
  }
});

app.get('/api/news', (req, res) => {
  const news = getAllNews();
  res.json({ success: true, count: news.length, news });
});

app.post('/api/news/refresh', requireAuth, async (req, res) => {
  try {
    const news = await fetchAllNews();
    res.json({ success: true, count: news.length, news });
  } catch (error) {
    console.error('刷新新闻失败:', error);
    res.status(500).json({ success: false, message: error.message || '刷新新闻失败' });
  }
});

app.get('/api/ai/predict', async (req, res) => {
  try {
    const environment = req.query.environment || 'production';
    const matches = readMatches(environment);

    try {
      updatePredictionResults(matches);
    } catch (e) {
      console.error('[Predict] 更新预测结果失败:', e.message);
    }

    const result = await predictMatches(matches);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('AI预测失败:', error);
    res.status(500).json({ success: false, message: error.message || 'AI预测失败' });
  }
});

app.get('/api/ai/predict/history', (req, res) => {
  try {
    const history = getPredictionHistory();
    res.json({ success: true, history });
  } catch (error) {
    console.error('获取预测历史失败:', error);
    res.status(500).json({ success: false, message: error.message || '获取预测历史失败' });
  }
});

app.get('/api/ai/predict/latest', (req, res) => {
  try {
    const environment = req.query.environment || 'production';
    const matches = readMatches(environment);

    try {
      updatePredictionResults(matches);
    } catch (e) {
      console.error('[Predict] 更新预测结果失败:', e.message);
    }

    const latest = getLatestPrediction();
    res.json({ success: true, prediction: latest });
  } catch (error) {
    console.error('获取最新预测失败:', error);
    res.status(500).json({ success: false, message: error.message || '获取最新预测失败' });
  }
});

const deleteUploadedFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.error('Failed to delete file:', filePath, e);
    }
  }
};

app.post('/api/admin/clear-data', requireAuth, (req, res) => {
  const { environment = 'production' } = req.body;

  const oldData = readData(environment);

  if (oldData.users && oldData.users.length > 0) {
    oldData.users.forEach(user => {
      if (user.avatar && user.avatar.startsWith('/uploads/avatars/')) {
        const avatarPath = path.join(AVATAR_DIR, user.avatar.replace('/uploads/avatars/', ''));
        deleteUploadedFile(avatarPath);
      }
    });
  }

  if (oldData.bets && oldData.bets.length > 0) {
    oldData.bets.forEach(bet => {
      if (bet.imageUrl && bet.imageUrl.startsWith('/uploads/bets/')) {
        const betImagePath = path.join(BET_DIR, bet.imageUrl.replace('/uploads/bets/', ''));
        deleteUploadedFile(betImagePath);
      }
    });
  }

  const data = {
    users: [],
    bets: [],
    matches: [],
    apiKey: '',
    competition: 'WC',
    theme: 'system',
    currentUserId: null,
  };
  writeData(environment, data);
  res.json({ success: true });
});

app.get('/api/admin/backups', requireAuth, (req, res) => {
  const environment = req.query.environment || 'production';
  const backups = listBackups(environment);
  res.json({ success: true, backups });
});

app.post('/api/admin/backups/create', requireAuth, (req, res) => {
  try {
    const { environment = 'production', label = 'manual' } = req.body;
    const result = createBackup(environment, label);
    res.json({ success: true, backup: result });
  } catch (e) {
    handleError(res, e, '创建备份失败');
  }
});

app.post('/api/admin/backups/restore', requireAuth, (req, res) => {
  try {
    const { environment = 'production', filename } = req.body;
    if (!filename) {
      return res.status(400).json({ success: false, message: '请选择备份文件' });
    }
    restoreBackup(environment, filename);
    res.json({ success: true, message: '还原成功' });
  } catch (e) {
    handleError(res, e, '还原失败');
  }
});

app.post('/api/admin/backups/delete', requireAuth, (req, res) => {
  try {
    const { environment = 'production', filename } = req.body;
    if (!filename) {
      return res.status(400).json({ success: false, message: '请选择备份文件' });
    }
    const ok = deleteBackup(environment, filename);
    res.json({ success: ok });
  } catch (e) {
    handleError(res, e, '删除失败');
  }
});

app.get('/api/admin/backups/download', requireAuth, (req, res) => {
  try {
    const environment = req.query.environment || 'production';
    const filename = req.query.filename;
    if (!filename) {
      return res.status(400).json({ success: false, message: '请选择备份文件' });
    }
    const filepath = resolveBackupPath(environment, filename);
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ success: false, message: '备份文件不存在' });
    }
    const content = fs.readFileSync(filepath, 'utf-8');
    res.json({ success: true, data: JSON.parse(content) });
  } catch (e) {
    handleError(res, e, '下载失败');
  }
});

const runAutoBackup = () => {
  try {
    ENVIRONMENTS.forEach((env) => {
      const data = readData(env);
      if (data.users && data.users.length > 0) {
        createBackup(env, 'auto');
        console.log(`[AutoBackup] Created backup for ${env}`);
      }
    });
  } catch (e) {
    console.error('[AutoBackup] Failed:', e);
  }
};

if (IS_PRODUCTION) {
  setTimeout(runAutoBackup, 5 * 60 * 1000);
  setInterval(runAutoBackup, AUTO_BACKUP_INTERVAL_MS);
  console.log(`Auto backup interval: ${AUTO_BACKUP_INTERVAL_MS / 1000}s, max backups: ${MAX_BACKUPS}`);
} else {
  console.log('Auto backup disabled (development mode)');
}

// ========== 服务器端赛程自动同步 ==========
const MATCH_SYNC_LIVE_INTERVAL = 60 * 1000;           // 有比赛时：1分钟
const MATCH_SYNC_UPCOMING_INTERVAL = 5 * 60 * 1000;   // 有即将开赛时：5分钟
const MATCH_SYNC_NORMAL_INTERVAL = 2 * 60 * 60 * 1000;    // 无比赛时：2小时

let matchSyncTimer = null;

const runMatchSync = async () => {
  try {
    const env = 'production';
    const data = readData(env);
    const apiKey = data.apiKey;
    const competition = data.competition || '2000';

    if (!apiKey) {
      console.warn('[MatchSync] No API key configured, skipping');
      return;
    }

    const result = await syncMatches(apiKey, competition);
    if (result.success) {
      writeMatches(env, result.matches);
      console.log(`[MatchSync] Synced ${result.matches.length} matches`);

      // 根据是否有直播比赛调整下次同步间隔
      scheduleNextMatchSync(result.matches);
    } else {
      console.warn(`[MatchSync] Failed: ${result.reason}`);
      scheduleNextMatchSync([]);
    }
  } catch (e) {
    console.error('[MatchSync] Error:', e);
    scheduleNextMatchSync([]);
  }
};

const scheduleNextMatchSync = (matches) => {
  if (matchSyncTimer) clearTimeout(matchSyncTimer);

  let interval;
  if (matches.some(m => m.status === 'live')) {
    interval = MATCH_SYNC_LIVE_INTERVAL;
  } else {
    // 检查是否有2小时内即将开赛的比赛
    const now = Date.now();
    const hasUpcoming = matches.some(m => {
      if (m.status !== 'upcoming') return false;
      const matchTime = new Date(m.matchTime).getTime();
      return matchTime - now > 0 && matchTime - now < 2 * 60 * 60 * 1000;
    });
    interval = hasUpcoming ? MATCH_SYNC_UPCOMING_INTERVAL : MATCH_SYNC_NORMAL_INTERVAL;
  }

  console.log(`[MatchSync] Next sync in ${interval / 1000}s`);
  matchSyncTimer = setTimeout(runMatchSync, interval);
};

if (IS_PRODUCTION) {
  // 启动后2分钟首次同步
  setTimeout(() => {
    console.log('[MatchSync] Starting initial sync...');
    runMatchSync();
  }, 2 * 60 * 1000);
  console.log('Match auto-sync enabled (initial sync in 2min)');
} else {
  console.log('Match auto-sync disabled (development mode)');
}

// ========== 自动预测功能 ==========
// 北京时间每天凌晨1点（前一天比赛已结束），自动预测明天的比赛
const AUTO_PREDICT_HOUR_BJ = 1; // 北京时间凌晨1点

const getBeijingNow = () => {
  const now = new Date();
  return new Date(now.getTime() + 8 * 60 * 60 * 1000);
};

const getMsUntilNextPredict = () => {
  const bjNow = getBeijingNow();
  const bjTomorrow = new Date(bjNow);
  bjTomorrow.setUTCDate(bjNow.getUTCDate() + 1);
  bjTomorrow.setUTCHours(AUTO_PREDICT_HOUR_BJ, 0, 0, 0);
  return bjTomorrow.getTime() - bjNow.getTime();
};

let autoPredictTimer = null;

const runAutoPredict = async () => {
  try {
    console.log('[AutoPredict] Starting auto prediction...');
    const env = 'production';
    const matches = readMatches(env);

    // 先更新已有预测的结果
    try {
      updatePredictionResults(matches);
    } catch (e) {
      console.error('[AutoPredict] 更新预测结果失败:', e.message);
    }

    const aiConfig = getAIConfig();
    if (!aiConfig || !aiConfig.apiKey) {
      console.warn('[AutoPredict] AI API密钥未配置，跳过自动预测');
      scheduleNextAutoPredict();
      return;
    }

    const result = await predictMatches(matches);
    console.log(`[AutoPredict] 预测完成，共 ${result.predictions.length} 场比赛`);
  } catch (e) {
    console.error('[AutoPredict] 自动预测失败:', e.message);
  }
  scheduleNextAutoPredict();
};

const scheduleNextAutoPredict = () => {
  if (autoPredictTimer) clearTimeout(autoPredictTimer);
  const ms = getMsUntilNextPredict();
  const hours = (ms / 1000 / 60 / 60).toFixed(2);
  console.log(`[AutoPredict] Next prediction in ${hours}h (at ${AUTO_PREDICT_HOUR_BJ}:00 Beijing time)`);
  autoPredictTimer = setTimeout(runAutoPredict, ms);
};

if (IS_PRODUCTION) {
  // 启动后5分钟首次检查（如果当天还没预测过）
  setTimeout(async () => {
    try {
      const latest = getLatestPrediction();
      const bjToday = getBeijingNow().toISOString().substring(0, 10);
      if (!latest || latest.date !== bjToday) {
        console.log('[AutoPredict] 启动时检测到今日未预测，开始首次预测...');
        await runAutoPredict();
      } else {
        console.log('[AutoPredict] 今日已预测过，等待定时任务');
        scheduleNextAutoPredict();
      }
    } catch (e) {
      console.error('[AutoPredict] 启动预测失败:', e.message);
      scheduleNextAutoPredict();
    }
  }, 5 * 60 * 1000);
  console.log('Auto-predict enabled');
} else {
  console.log('Auto-predict disabled (development mode)');
}

app.get('/api/proxy/football/:path(*)', async (req, res) => {
  await proxyFootballApi(req, res, 'GET');
});

app.post('/api/proxy/football/:path(*)', async (req, res) => {
  await proxyFootballApi(req, res, 'POST');
});

app.use(express.static(DIST_DIR));

app.get('*', (req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Data directory: ${DATA_DIR}`);
  console.log(`Upload directory: ${UPLOAD_DIR}`);
  console.log(`Backup directory: ${BACKUP_DIR}`);
  initNewsService();
});
