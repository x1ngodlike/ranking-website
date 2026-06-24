const express = require('express');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
const AVATAR_DIR = path.join(UPLOAD_DIR, 'avatars');
const BET_DIR = path.join(UPLOAD_DIR, 'bets');
const DIST_DIR = process.env.DIST_DIR || path.join(__dirname, '..', 'dist');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '159357';
const AUTO_BACKUP_INTERVAL_MS = parseInt(process.env.AUTO_BACKUP_INTERVAL_MS || '3600000', 10);
const MAX_BACKUPS = parseInt(process.env.MAX_BACKUPS || '30', 10);

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(AVATAR_DIR)) {
  fs.mkdirSync(AVATAR_DIR, { recursive: true });
}
if (!fs.existsSync(BET_DIR)) {
  fs.mkdirSync(BET_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const AUTH_FILE = path.join(DATA_DIR, 'auth.json');
const getDataFile = (env) => path.join(DATA_DIR, `data-${env}.json`);
const getBackupDir = (env) => path.join(BACKUP_DIR, env);

function ensureBackupDir(env) {
  const dir = getBackupDir(env);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(UPLOAD_DIR));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, AVATAR_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const betStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, BET_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

const uploadBet = multer({
  storage: betStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

function readData(env = 'production') {
  const file = getDataFile(env);
  if (!fs.existsSync(file)) {
    return {
      users: [],
      bets: [],
      matches: [],
      apiKey: '',
      competition: 'WC',
      theme: 'system',
      currentUserId: null,
    };
  }
  try {
    const raw = fs.readFileSync(file, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read data:', e);
    return { users: [], bets: [], matches: [], apiKey: '', competition: 'WC', theme: 'system', currentUserId: null };
  }
}

function writeData(env, data) {
  const file = getDataFile(env);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

function readAuth() {
  if (!fs.existsSync(AUTH_FILE)) {
    const hash = bcrypt.hashSync(DEFAULT_ADMIN_PASSWORD, 10);
    const auth = { adminPasswordHash: hash };
    fs.writeFileSync(AUTH_FILE, JSON.stringify(auth, null, 2), 'utf-8');
    return auth;
  }
  try {
    const raw = fs.readFileSync(AUTH_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    const hash = bcrypt.hashSync(DEFAULT_ADMIN_PASSWORD, 10);
    return { adminPasswordHash: hash };
  }
}

function writeAuth(auth) {
  fs.writeFileSync(AUTH_FILE, JSON.stringify(auth, null, 2), 'utf-8');
}

// 备份相关函数
function createBackup(env, label = 'manual') {
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

  fs.writeFileSync(filepath, JSON.stringify(backupContent, null, 2), 'utf-8');

  // 清理超出数量限制的旧备份
  cleanOldBackups(env);

  return { filename, createdAt: backupContent.createdAt, label, size: fs.statSync(filepath).size };
}

function listBackups(env) {
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
        // ignore
      }
      return {
        filename: f,
        size: stat.size,
        createdAt: meta.createdAt,
        label: meta.label,
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function cleanOldBackups(env) {
  const backups = listBackups(env);
  if (backups.length > MAX_BACKUPS) {
    const toDelete = backups.slice(MAX_BACKUPS);
    const dir = getBackupDir(env);
    toDelete.forEach((b) => {
      try {
        fs.unlinkSync(path.join(dir, b.filename));
      } catch (e) {
        console.error('Failed to delete old backup:', b.filename, e);
      }
    });
  }
}

function deleteBackup(env, filename) {
  const dir = getBackupDir(env);
  const filepath = path.join(dir, filename);
  if (!fs.existsSync(filepath)) return false;
  // 安全检查：防止路径穿越
  const resolved = path.resolve(filepath);
  if (!resolved.startsWith(path.resolve(dir))) return false;
  fs.unlinkSync(filepath);
  return true;
}

function restoreBackup(env, filename) {
  const dir = getBackupDir(env);
  const filepath = path.join(dir, filename);
  // 安全检查：防止路径穿越
  const resolved = path.resolve(filepath);
  if (!resolved.startsWith(path.resolve(dir))) {
    throw new Error('非法的备份文件路径');
  }
  if (!fs.existsSync(filepath)) {
    throw new Error('备份文件不存在');
  }
  const content = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  if (!content.data) {
    throw new Error('备份文件格式错误');
  }
  writeData(env, content.data);
  return content.data;
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/data', (req, res) => {
  const environment = req.query.environment || 'production';
  const data = readData(environment);
  res.json({ ...data, environment });
});

app.post('/api/data', (req, res) => {
  const { environment = 'production', ...data } = req.body;
  writeData(environment, data);
  res.json({ success: true });
});

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const auth = readAuth();
  const valid = bcrypt.compareSync(password, auth.adminPasswordHash);
  if (valid) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: '密码错误' });
  }
});

app.post('/api/admin/password', (req, res) => {
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

app.post('/api/admin/clear-data', (req, res) => {
  const { environment = 'production' } = req.body;

  const oldData = readData(environment);
  if (oldData.users && oldData.users.length > 0) {
    oldData.users.forEach(user => {
      if (user.avatar && user.avatar.startsWith('/uploads/avatars/')) {
        const avatarPath = path.join(AVATAR_DIR, user.avatar.replace('/uploads/avatars/', ''));
        if (fs.existsSync(avatarPath)) {
          try {
            fs.unlinkSync(avatarPath);
          } catch (e) {
            console.error('Failed to delete avatar:', avatarPath, e);
          }
        }
      }
    });
  }
  // 清除投注图片
  if (oldData.bets && oldData.bets.length > 0) {
    oldData.bets.forEach(bet => {
      if (bet.imageUrl && bet.imageUrl.startsWith('/uploads/bets/')) {
        const betImagePath = path.join(BET_DIR, bet.imageUrl.replace('/uploads/bets/', ''));
        if (fs.existsSync(betImagePath)) {
          try {
            fs.unlinkSync(betImagePath);
          } catch (e) {
            console.error('Failed to delete bet image:', betImagePath, e);
          }
        }
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

// 备份相关API
app.get('/api/admin/backups', (req, res) => {
  const environment = req.query.environment || 'production';
  const backups = listBackups(environment);
  res.json({ success: true, backups });
});

app.post('/api/admin/backups/create', (req, res) => {
  try {
    const { environment = 'production', label = 'manual' } = req.body;
    const result = createBackup(environment, label);
    res.json({ success: true, backup: result });
  } catch (e) {
    console.error('Failed to create backup:', e);
    res.status(500).json({ success: false, message: '创建备份失败' });
  }
});

app.post('/api/admin/backups/restore', (req, res) => {
  try {
    const { environment = 'production', filename } = req.body;
    if (!filename) {
      return res.status(400).json({ success: false, message: '请选择备份文件' });
    }
    restoreBackup(environment, filename);
    res.json({ success: true, message: '还原成功' });
  } catch (e) {
    console.error('Failed to restore backup:', e);
    res.status(500).json({ success: false, message: e.message || '还原失败' });
  }
});

app.post('/api/admin/backups/delete', (req, res) => {
  try {
    const { environment = 'production', filename } = req.body;
    if (!filename) {
      return res.status(400).json({ success: false, message: '请选择备份文件' });
    }
    const ok = deleteBackup(environment, filename);
    res.json({ success: ok });
  } catch (e) {
    console.error('Failed to delete backup:', e);
    res.status(500).json({ success: false, message: '删除失败' });
  }
});

// 自动备份机制
function runAutoBackup() {
  try {
    const environments = ['production', 'test'];
    environments.forEach((env) => {
      const data = readData(env);
      // 只备份有数据的环境
      if (data.users && data.users.length > 0) {
        createBackup(env, 'auto');
        console.log(`[AutoBackup] Created backup for ${env}`);
      }
    });
  } catch (e) {
    console.error('[AutoBackup] Failed:', e);
  }
}

// 启动时延迟5分钟执行首次自动备份，避免启动时立即备份空数据
setTimeout(runAutoBackup, 5 * 60 * 1000);
// 之后按设定的间隔执行
setInterval(runAutoBackup, AUTO_BACKUP_INTERVAL_MS);

// 代理 football-data.org API 请求
app.get('/api/proxy/football/:path(*)', async (req, res) => {
  const apiKey = req.query.apiKey || '';
  const targetPath = req.params.path;
  const targetUrl = `https://api.football-data.org/v4/${targetPath}`;
  
  try {
    const response = await fetch(targetUrl, {
      headers: {
        'X-Auth-Token': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Football API proxy error:', error.message);
    res.status(500).json({ message: '代理请求失败: ' + error.message });
  }
});

app.post('/api/proxy/football/:path(*)', async (req, res) => {
  const apiKey = req.query.apiKey || '';
  const targetPath = req.params.path;
  const targetUrl = `https://api.football-data.org/v4/${targetPath}`;
  
  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'X-Auth-Token': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Football API proxy error:', error.message);
    res.status(500).json({ message: '代理请求失败: ' + error.message });
  }
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
  console.log(`Auto backup interval: ${AUTO_BACKUP_INTERVAL_MS / 1000}s, max backups: ${MAX_BACKUPS}`);
});
