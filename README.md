# 世界杯体彩中奖排行榜

一个用于记录和统计世界杯体彩中奖情况的排行榜应用。支持多用户管理、中奖记录追踪、图片上传、赛程同步等功能。

## 功能特性

- 🏆 **中奖排行榜**：按总盈亏、胜率、投注次数排序，Top3 领奖台展示
- 👥 **多用户管理**：支持添加/编辑成员，自定义头像，头像懒加载
- 📝 **中奖记录**：记录投注信息、中奖金额、备注、图片上传
- 🖼️ **图片上传**：支持点击、拖拽、粘贴上传，自动压缩（最大 1280px，质量 80%）
- 🔍 **图片查看**：点击图片放大查看，支持缩放
- ⚽ **赛程同步**：对接 football-data.org API 同步世界杯赛程，按北京时间显示
- 🔄 **自动刷新**：赛程比分自动刷新，默认 1 分钟，可自定义间隔
- 📱 **下拉刷新**：首页支持下拉刷新，兼容微信内浏览器
- 🌓 **深色模式**：支持浅色/深色主题切换，主题保存在浏览器本地
- 🔐 **管理员权限**：敏感操作需管理员登录验证（bcrypt 加密）
- 💾 **自动备份**：启动后 5 分钟首次备份，之后每 15 分钟一次，保留 50 条自动备份
- 📤 **备份还原**：支持手动备份/还原/下载，手动备份不自动删除
- 🧪 **环境切换**：支持 production / test 双环境数据隔离

## 技术栈

### 前端
- React 18 + TypeScript
- Vite 构建工具
- TailwindCSS 样式框架
- Zustand 状态管理
- Framer Motion 动画
- Recharts 图表库
- Lucide React 图标

### 后端
- Node.js + Express
- JSON 文件存储（data.json / matches.json 数据分离）
- bcrypt 密码加密
- multer 文件上传
- Sharp 图片压缩

## 设计规范

- **主色调**：海军蓝 (#3F51B5) + 世界杯金色 (#D4AF37)
- **股价色**：红涨绿跌（中国风格）
- **金额格式**：¥ RMB，支持 2 位小数
- **响应式**：移动端优先，自适应桌面端
- **按钮样式**：btn-gold（深金渐变）/ btn-outline（金边透明底）

## 快速开始

### 开发环境

```bash
# 安装前端依赖
npm install

# 启动前端开发服务器
npm run dev
```

### 后端服务

```bash
cd server
npm install
node server.js
```

后端默认端口：5936

## Docker 部署

```bash
# 构建镜像
docker build -t ranking-website .

# 运行容器
docker run -d \
  -p 5936:5936 \
  -v /path/to/data:/app/data \
  -v /path/to/uploads:/app/uploads \
  ranking-website
```

## 或使用 docker-compose

```bash
docker-compose up -d
```

## Unraid 部署

项目目录：`/mnt/user/appdata/ranking-website/`

```bash
cd /mnt/user/appdata/ranking-website/deploy
./build.sh --rebuild
```

## 目录结构

```
├── src/                    # 前端源码
│   ├── components/         # 组件
│   │   ├── Layout/         # 布局组件
│   │   ├── BackupModal/    # 备份管理
│   │   ├── SettingsModal/  # 设置面板
│   │   ├── ApiSettingsModal/ # API 设置
│   │   ├── RankingPodium/  # Top3 领奖台
│   │   ├── RankingList/    # 排名列表
│   │   ├── BetForm/        # 投注表单
│   │   ├── BetList/        # 投注列表
│   │   └── ...
│   ├── pages/              # 页面
│   │   ├── RankingPage.tsx # 排行榜首页
│   │   ├── BetsPage.tsx    # 中奖记录页
│   │   ├── MatchesPage.tsx # 比赛赛程页
│   │   └── UsersPage.tsx   # 用户管理页
│   ├── store/              # 状态管理 (Zustand)
│   │   └── useAppStore.ts
│   ├── utils/              # 工具函数
│   │   ├── api.ts          # API 请求
│   │   ├── helpers.ts      # 格式化工具
│   │   ├── calculations.ts # 盈亏/排名计算
│   │   └── apiConfig.ts    # API 配置
│   ├── services/           # 服务层
│   │   └── footballApi.ts  # 足球 API 服务
│   └── types/              # 类型定义
├── server/                 # 后端服务
│   ├── server.js           # Express 服务器
│   ├── data/               # 数据文件
│   │   ├── production/     # 生产环境数据
│   │   │   ├── data.json   # 用户数据 + 投注记录
│   │   │   ├── matches.json # 赛程数据
│   │   │   └── backups/    # 备份文件
│   │   ├── test/           # 测试环境数据
│   │   └── auth.json       # 管理员密码
│   └── package.json
├── deploy/                 # 部署脚本
└── uploads/                # 上传文件
    ├── avatars/            # 用户头像
    └── bets/               # 中奖记录图片
```

## 数据结构

### data.json（用户数据）
```json
{
  "users": [...],
  "bets": [...],
  "apiKey": "...",
  "competition": "WC",
  "currentUserId": "user1"
}
```

### matches.json（赛程数据）
```json
{
  "matches": [...]
}
```

## 备份机制

- **自动备份**：启动 5 分钟后首次备份，之后每 15 分钟一次
- **自动备份保留**：最多 50 条，超出自动删除最旧的
- **手动备份**：管理员可手动创建，标注为 manual，不参与自动清理
- **备份内容**：仅用户数据（users + bets + apiKey + competition），不含赛程
- **备份下载**：完整 JSON 文件，可下载保存

## 管理员

默认管理员密码：`159357`

登录后可在设置中修改密码。

## 安全说明

- 管理员密码使用 bcrypt 加密存储
- 所有写入操作需 Bearer Token 认证
- Token 有效期 24 小时
- 图片上传限制大小和类型，自动压缩
- 文本数据和图片数据分离存放

## License

MIT
