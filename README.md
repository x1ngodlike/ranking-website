# 世界杯体彩中奖排行榜

一个用于记录和统计世界杯体彩中奖情况的排行榜应用。支持多用户管理、中奖记录追踪、图片上传、赛程同步等功能。

## 功能特性

- 🏆 **中奖排行榜**：按中奖总额、记录总数排序
- 👥 **多用户管理**：支持添加/编辑成员，自定义头像
- 📝 **中奖记录**：记录中奖金额、备注、图片上传
- 🖼️ **图片上传**：支持点击、拖拽、粘贴上传，自动压缩
- 🔍 **图片查看**：点击图片放大查看，支持缩放
- ⚽ **赛程同步**：对接 football-data.org API 同步世界杯赛程
- 🌓 **深色模式**：支持浅色/深色主题切换
- 🔐 **管理员权限**：敏感操作需管理员登录验证
- 💾 **自动备份**：定时自动备份数据，支持手动备份/还原

## 技术栈

### 前端
- React 18 + TypeScript
- Vite 构建工具
- TailwindCSS 样式框架
- Zustand 状态管理
- Framer Motion 动画
- Recharts 图表库

### 后端
- Node.js + Express
- JSON 文件存储
- bcrypt 密码加密
- multer 文件上传

## 快速开始

### 开发环境

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 后端服务

```bash
cd server
npm install
node server.js
```

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
│   ├── components/       # 组件
│   ├── pages/          # 页面
│   ├── store/          # 状态管理
│   ├── utils/          # 工具函数
│   └── types/          # 类型定义
├── server/              # 后端服务
│   ├── server.js        # Express 服务器
│   ├── data/            # 数据文件
│   └── package.json
├── deploy/              # 部署脚本
└── uploads/             # 上传文件
    ├── avatars/      # 用户头像
    └── bets/         # 中奖记录图片
```

## 管理员

默认管理员密码

`159357`

登录后可修改密码。

## 安全说明

- 管理员密码使用 bcrypt 加密存储
- 所有写入操作需 Bearer Token 认证
- Token 有效期 24 小时
- 图片上传限制大小和类型
- 文件存储分离存放

## License

MIT
