const express = require('express');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

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
  refreshInterval: 60,
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
    refreshInterval: data.refreshInterval || 60,
  };
  writeJsonFile(getDataFile(env), dataToSave);
};

const readMatches = (env = 'production') => readJsonFile(getMatchesFile(env), []);

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

  try {
    const fetchOptions = {
      method,
      headers: {
        'X-Auth-Token': apiKey,
        'Content-Type': 'application/json'
      }
    };
    if (method === 'POST') {
      fetchOptions.body = JSON.stringify(req.body);
    }
    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Football API proxy error:', error.message);
    res.status(500).json({ message: '代理请求失败: ' + error.message });
  }
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

app.get('/api/settings/auto-refresh', (req, res) => {
  const environment = req.query.environment || 'production';
  const data = readData(environment);
  res.json({
    success: true,
    autoRefresh: true,
    refreshInterval: data.refreshInterval || 60,
  });
});

app.post('/api/settings/auto-refresh', requireAuth, (req, res) => {
  const environment = req.query.environment || 'production';
  const { refreshInterval = 60 } = req.body;
  const data = readData(environment);
  data.refreshInterval = Math.max(10, Math.min(3600, parseInt(refreshInterval) || 60));
  writeData(environment, data);
  res.json({ success: true, refreshInterval: data.refreshInterval });
});

// ========== 成就徽章系统 ==========

// 徽章配置
const BADGE_DEFINITIONS = [
  // 单日爆发类
  { id: 'meierduka', name: '梅开二度', condition: { type: 'dailyWins', value: 2 }, rarity: 2 },
  { id: 'maozixifa', name: '帽子戏法', condition: { type: 'dailyWins', value: 3 }, rarity: 3 },
  { id: 'sixilinmen', name: '四喜临门', condition: { type: 'dailyWins', value: 4 }, rarity: 4 },
  { id: 'wuzidengke', name: '五子登科', condition: { type: 'dailyWins', value: 5 }, rarity: 5 },
  // 累计盈利类
  { id: 'xiaoyouhuoshou', name: '小有收获', condition: { type: 'totalProfit', value: 200 }, rarity: 1 },
  { id: 'caiyuanggungun', name: '财源滚滚', condition: { type: 'totalProfit', value: 1000 }, rarity: 2 },
  { id: 'jinkubazhu', name: '金库霸主', condition: { type: 'totalProfit', value: 2000 }, rarity: 3 },
  { id: 'rijindoujin', name: '日进斗金', condition: { type: 'totalProfit', value: 6000 }, rarity: 4 },
  { id: 'yiwanfuweng', name: '亿万富翁', condition: { type: 'totalProfit', value: 10000 }, rarity: 5 },
  // 累计次数类
  { id: 'kaimenhong', name: '开门红', condition: { type: 'totalWins', value: 1 }, rarity: 1 },
  { id: 'shinaojiuwen', name: '十拿九稳', condition: { type: 'totalWins', value: 10 }, rarity: 3 },
  { id: 'baizhanbaisheng', name: '百战百胜', condition: { type: 'totalWins', value: 50 }, rarity: 5 },
  // 特殊里程碑类
  { id: 'jimuzhanxianzhi', name: '揭幕战先知', condition: { type: 'milestoneDate', value: '2026-06-15' }, rarity: 2 },
  { id: 'juesaiyuyanjia', name: '决赛预言家', condition: { type: 'milestoneDate', value: '2026-07-19' }, rarity: 5 },
  // 单日盈利类
  { id: 'yiyebaofu', name: '一夜暴富', condition: { type: 'dailyProfit', value: 500 }, rarity: 3 },
  { id: 'caishenjianglin', name: '财神降临', condition: { type: 'dailyProfit', value: 2500 }, rarity: 4 },
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
    const date = bet.createdAt ? bet.createdAt.substring(0, 10) : 'unknown';
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
});
