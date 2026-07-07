# 2026 世界杯体彩中奖排行榜

一个用于记录和统计 2026 世界杯体彩中奖情况的排行榜应用。支持多用户管理、中奖记录追踪、AI 图片识别、赛程同步、年度报告等功能。

## 功能特性

### 核心功能
- 🏆 **中奖排行榜**：按总盈亏、胜率、投注次数排序，Top3 领奖台展示
- 👥 **多用户管理**：支持添加/编辑成员，自定义头像（emoji/图片），头像懒加载
- 📝 **中奖记录**：记录投注信息、中奖金额、备注、图片上传
- 🖼️ **图片上传**：支持点击、拖拽、粘贴上传
- 🔍 **图片查看**：点击图片放大查看，支持缩放
- 🎨 **深色模式**：支持浅色/深色主题切换，主题保存在浏览器本地

### AI 智能识别
- 🤖 **AI 彩票识别**：上传彩票图片自动识别对阵、玩法、投注选项、比分、中奖结果
- 💬 **AI 幽默点评**：识别后生成风趣幽默的点评文案
- ⚡ **AI 比赛预测**：自动预测次日比赛结果，提供胜负参考
- 🔧 **AI 配置**：支持自定义 API 地址、密钥、模型、官网地址，配置存储在服务端

### 赛程与新闻
- ⚽ **赛程同步**：对接 football-data.org API 同步世界杯赛程，按北京时间显示
- 🔄 **自动刷新**：赛程比分自适应刷新（有 live 比赛 1 分钟、即将开赛 5 分钟、无比赛 2 小时）
- 📰 **热点新闻**：自动抓取世界杯相关热点新闻
- 🏟️ **淘汰赛对阵图**：可视化展示淘汰赛对阵关系和晋级路径

### 工具与报告
- 📊 **世界杯年度报告**：14 页精美报告，包含财富曲线、最擅长玩法、最有缘球队、社交对比等
- 💰 **奖金计算器**：内置奖金计算工具（嵌入第三方页面）
- 🏅 **成就徽章**：多种稀有度徽章，5 星钻石渐变紫辉光、4 星金边金光
- 💾 **自动备份**：启动后 5 分钟首次备份，之后每 15 分钟一次，保留 50 条自动备份
- 📤 **备份还原**：支持手动备份/还原/下载，手动备份不自动删除

### 权限与安全
- 🔐 **管理员权限**：敏感操作需管理员登录验证（bcrypt 加密）
- 👑 **管理员标识**：Header 显示管理员登录状态，刷新按钮仅管理员可见
- 🔑 **密码修改**：管理员可修改登录密码
- 🛡️ **数据安全**：文本数据和图片数据分离存储

## 技术栈

### 前端
- React 18 + TypeScript
- Vite 构建工具
- TailwindCSS 样式框架
- Zustand 状态管理
- Framer Motion 动画
- Lucide React 图标

### 后端
- Node.js + Express
- JSON 文件存储（数据分离：用户数据 / 赛程数据 / AI 配置）
- bcryptjs 密码加密
- multer 文件上传

### AI 能力
- 支持 OpenAI 兼容的多模态 API（GPT-4o、DeepSeek-VL 等）
- 图片识别 + 文本生成
- 60 秒超时保护，失败自动清理状态

## 玩法类型

支持以下体彩竞彩足球玩法的识别和统计：

| 玩法 | 说明 |
|------|------|
| ⚖️ 胜平负 | 包含普通胜平负和让球胜平负 |
| 🔢 比分 | 预测具体比分，支持复式投注 |
| ⚽ 总进球数 | 预测总进球数，支持多选 |
| ⏱️ 半全场 | 半场+全场结果组合 |

> 所有玩法均按 90 分钟常规时间（含伤停补时）的比分结算，加时赛和点球大战不算。

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

后端默认端口：`5936`

### 访问地址
- 本地开发：http://localhost:5178/
- 后端 API：http://localhost:5936/

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
├── src/                       # 前端源码
│   ├── components/            # 组件
│   │   ├── Layout/            # 布局组件 (Header/MobileNav)
│   │   ├── SettingsModal/     # 设置面板
│   │   ├── BackupModal/       # 备份管理
│   │   ├── PasswordModal/     # 密码修改
│   │   ├── AIConfigModal/     # AI 配置
│   │   ├── ApiSettingsModal/  # API 设置
│   │   ├── UsersModal/        # 用户管理弹窗
│   │   ├── EditUserModal/     # 编辑用户弹窗
│   │   ├── RankingPodium/     # Top3 领奖台
│   │   ├── RankingList/       # 排名列表
│   │   ├── BetForm/           # 投注表单
│   │   ├── BetList/           # 投注列表
│   │   ├── MatchCard/         # 比赛卡片
│   │   ├── KnockoutBracket/   # 淘汰赛对阵图
│   │   ├── TrendChart/        # 趋势图表
│   │   ├── Charts/            # 图表组件
│   │   ├── AvatarPicker/      # 头像选择器
│   │   ├── BadgeDisplay/      # 徽章展示
│   │   ├── ThemeToggle/       # 主题切换
│   │   ├── DesignVersionToggle/ # 设计版本切换
│   │   ├── ImageUploader/     # 图片上传
│   │   ├── ImageViewer/       # 图片查看
│   │   └── Avatar.tsx         # 头像组件
│   ├── pages/                 # 页面
│   │   ├── RankingPage.tsx    # 排行榜首页
│   │   ├── BetsPage.tsx       # 中奖记录页
│   │   ├── MatchesPage.tsx    # 比赛赛程页
│   │   ├── NewsPage.tsx       # 热点新闻页
│   │   ├── CalculatorPage.tsx # 奖金计算器页
│   │   ├── ProfilePage.tsx    # 个人主页
│   │   └── ReportPage.tsx     # 世界杯年度报告
│   ├── store/                 # 状态管理 (Zustand)
│   │   └── useAppStore.ts
│   ├── utils/                 # 工具函数
│   │   ├── api.ts             # API 请求
│   │   ├── helpers.ts         # 通用工具
│   │   ├── calculations.ts    # 盈亏/排名计算
│   │   ├── aiParser.ts        # AI 结果解析
│   │   ├── reportData.ts      # 报告数据生成
│   │   ├── badges.ts          # 徽章逻辑
│   │   ├── theme.ts           # 主题管理
│   │   ├── apiConfig.ts       # API 配置存储
│   │   └── imageCompress.ts   # 图片压缩
│   ├── services/              # 服务层
│   │   └── footballApi.ts     # 足球 API 服务
│   └── types/                 # 类型定义
│       └── index.ts
├── server/                    # 后端服务
│   ├── server.js              # Express 服务器主入口
│   ├── matchSync.js           # 赛程同步
│   ├── aiRecognition.js       # AI 图片识别
│   ├── aiPrediction.js        # AI 比赛预测
│   ├── aiConfig.js            # AI 配置管理
│   ├── footballNews.js        # 足球新闻抓取
│   └── package.json
├── public/                    # 静态资源
│   └── report/                # 报告背景图
├── deploy/                    # 部署脚本
│   └── build.sh
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## 数据结构

### 数据文件

| 文件 | 说明 |
|------|------|
| `data.json` | 用户数据 + 投注记录 |
| `matches.json` | 赛程数据 |
| `auth.json` | 管理员密码（bcrypt 加密） |
| `ai-config.json` | AI API 配置 |

### data.json 结构

```json
{
  "users": [...],
  "bets": [...],
  "currentUserId": "user1"
}
```

### matches.json 结构

```json
{
  "matches": [...]
}
```

## 备份机制

- **自动备份**：启动 5 分钟后首次备份，之后每 15 分钟一次
- **自动备份保留**：最多 50 条，超出自动删除最旧的
- **手动备份**：管理员可手动创建，标注为 manual，不参与自动清理
- **备份内容**：仅用户数据（users + bets），不含赛程和 AI 配置
- **备份下载**：完整 JSON 文件，可下载保存

## 管理员

默认管理员密码：`159357`

登录后可在设置中修改密码。

### 管理员可见功能
- 🔄 刷新按钮（赛程/新闻/AI预测）
- ⚙️ 设置面板全部功能
- 👥 成员管理
- 💾 备份/还原
- 🤖 AI 配置
- 🔑 密码修改

## AI 配置说明

AI 配置存储在服务端 `data/ai-config.json`，包含：

| 字段 | 说明 |
|------|------|
| `apiEndpoint` | API 接口地址 |
| `apiKey` | API 密钥 |
| `model` | 模型名称（默认 gpt-4o-mini） |
| `siteUrl` | 官网地址（用于图片访问） |

> ⚠️ 未配置 AI API 时，点击"AI评价"会提示先在设置中配置。

## 安全说明

- 管理员密码使用 bcryptjs 加密存储
- 所有写入操作需 Bearer Token 认证
- Token 有效期 24 小时
- 图片上传限制大小和类型
- 文本数据和图片数据分离存放
- AI API 密钥存储在服务端，不暴露给前端

## License

MIT
