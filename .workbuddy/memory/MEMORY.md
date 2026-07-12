# ranking-website 项目记忆

## 项目身份
- 2026 世界杯体彩中奖排行榜 Web 应用（React18+TS+Vite 前端 / Node+Express 后端 / JSON 文件存储）。
- 亮点功能：AI 彩票图片识别、赛程同步（football-data.org）、14 页年度报告、成就徽章、自动备份。
- 默认管理员密码 `159357`（散落在 README、docker-compose、server.js、前端 calculations.ts，需整改）。

## 部署架构（关键，影响任何改动的安全性）
- 部署目标：用户 Unraid Docker。
- 构建：Dockerfile 多阶段，`npm run build` 出 dist + 拷贝 server/*.js 进镜像，`CMD node server.js`。
- 数据持久化：**宿主机 bind mount**（`deploy/build.sh:162-163` 用 `-v ${DATA_DIR}:/app/data` 和 `-v ${UPLOADS_DIR}:/app/uploads`），不是 Docker 匿名卷 → 重建镜像/容器不会丢失数据，前提是别删宿主机 data/ 目录，也别用 `docker compose down -v`。
- 端口：docker 用 5936（PORT 环境变量），dev 用 3001（server.js 默认），vite proxy 指向 3001。
- 重新部署：`bash deploy/build.sh --rebuild`（会 docker rm + rmi + rebuild + run，无先备份步骤，建议部署前手动备份）。

## 已识别的优化点（按优先级）
- P0 数据安全：writeJsonFile 非原子写（崩溃会损坏 data.json）✅已修复（tmp+rename 原子写 + 写入串行化）；前端每次全量保存整份 state 导致并发 last-write-wins 丢数据 ✅已加 600ms 防抖；淘汰赛排序硬编码 2026 具体对阵（server.js order32/order16）⏳未做。
- P1 安全：默认密码多处散落、前端 bundle 含密码常量、登录无暴力破解防护 ⏳未做。
- P2：competition 默认值 WC vs 2000 不一致；calculateRankings O(n²) 无 memo；server.js 1489 行单体；Mock 数据掩盖真实空状态 ⏳未做。

## 已完成的改动（2026-07-12）
- server.js：writeJsonFile 原子写；新增 writeChain/serializedWrite 串行化；相关路由改 async/await。
- src/store/useAppStore.ts：saveToServer 改 600ms 防抖 + beforeunload 刷盘。

## 改动安全性结论
- 仅改源码不影响线上容器（独立副本）。重新部署数据也安全（bind mount + 格式不变）。
- 原子写/写锁/防抖均保持 data.json 格式不变，无需迁移。
- 重新部署前建议手动备份一次。
