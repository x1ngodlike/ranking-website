#!/bin/bash

# ================================================
# 世界杯体彩收支统计排行榜 - Unraid 部署脚本
# ================================================

set -e

# 配置
CONTAINER_NAME="world-cup-betting"
IMAGE_NAME="world-cup-betting"
PORT=3001
ADMIN_PASSWORD=${ADMIN_PASSWORD:-"159357"}
DATA_DIR="${SCRIPT_DIR}/data"
UPLOADS_DIR="${SCRIPT_DIR}/uploads"
AUTO_BACKUP_INTERVAL=${AUTO_BACKUP_INTERVAL:-"3600000"}
MAX_BACKUPS=${MAX_BACKUPS:-"30"}

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 获取脚本所在目录（无论从哪里执行）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 打印分隔线
print_line() {
    echo "============================================"
}

# 获取 Unraid 服务器 IP
get_server_ip() {
    # 尝试多种方式获取 IP
    local ip=$(ip route get 1.1.1.1 2>/dev/null | grep -oP 'src \K\S+' | head -1)
    if [ -z "$ip" ]; then
        ip=$(hostname -I 2>/dev/null | awk '{print $1}')
    fi
    if [ -z "$ip" ]; then
        ip="<YOUR_UNRAID_IP>"
    fi
    echo "$ip"
}

# 检查 Docker 是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    log_success "Docker 环境检查通过"
}

# 停止并删除旧容器
cleanup_old_container() {
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        log_warn "发现旧容器，正在停止并删除..."
        docker stop ${CONTAINER_NAME} 2>/dev/null || true
        docker rm ${CONTAINER_NAME} 2>/dev/null || true
        log_success "旧容器已清理"
    fi
}

# 创建数据目录
create_directories() {
    log_info "创建数据目录..."
    mkdir -p "${DATA_DIR}/production"
    mkdir -p "${DATA_DIR}/test"
    mkdir -p "${DATA_DIR}/backups/production"
    mkdir -p "${DATA_DIR}/backups/test"
    mkdir -p "${UPLOADS_DIR}"
    
    # 设置权限
    chmod -R 755 "${DATA_DIR}" 2>/dev/null || true
    chmod -R 755 "${UPLOADS_DIR}" 2>/dev/null || true
    
    log_success "数据目录创建完成"
}

# 清理旧镜像
cleanup_old_image() {
    if docker images --format '{{.Repository}}' | grep -q "^${IMAGE_NAME}$"; then
        log_warn "发现旧镜像，正在删除..."
        docker rmi ${IMAGE_NAME}:latest 2>/dev/null || true
        docker rmi ${IMAGE_NAME} 2>/dev/null || true
    fi
}

# 构建 Docker 镜像
build_image() {
    log_info "开始构建 Docker 镜像..."
    log_info "这可能需要几分钟时间，请耐心等待..."
    
    cd "${SCRIPT_DIR}"
    
    # 使用缓存或不适用缓存构建
    if [ "$1" == "--no-cache" ]; then
        docker build --no-cache -t ${IMAGE_NAME}:latest .
    else
        docker build -t ${IMAGE_NAME}:latest .
    fi
    
    if [ $? -eq 0 ]; then
        log_success "镜像构建成功"
    else
        log_error "镜像构建失败"
        exit 1
    fi
}

# 运行容器
run_container() {
    log_info "启动容器..."
    
    # 检查端口是否被占用
    if docker ps --format '{{.Ports}}' | grep -q ":${PORT}->"; then
        log_error "端口 ${PORT} 已被占用，请先停止占用该端口的容器"
        exit 1
    fi
    
    cd "${SCRIPT_DIR}"
    
    # 使用 docker run 启动（兼容性更好）
    docker run -d \
        --name ${CONTAINER_NAME} \
        --restart unless-stopped \
        -p ${PORT}:3001 \
        -e PORT=${PORT} \
        -e ADMIN_PASSWORD=${ADMIN_PASSWORD} \
        -e TZ=Asia/Shanghai \
        -e AUTO_BACKUP_INTERVAL_MS=${AUTO_BACKUP_INTERVAL} \
        -e MAX_BACKUPS=${MAX_BACKUPS} \
        -v "${DATA_DIR}:/app/data" \
        -v "${UPLOADS_DIR}:/app/uploads" \
        -v /etc/localtime:/etc/localtime:ro \
        -v /etc/timezone:/etc/timezone:ro \
        --health-cmd="wget --no-verbose --tries=1 --spider http://localhost:${PORT}/api/health || exit 1" \
        --health-interval=30s \
        --health-timeout=10s \
        --health-retries=3 \
        --health-start-period=10s \
        ${IMAGE_NAME}:latest
    
    if [ $? -eq 0 ]; then
        log_success "容器启动成功"
    else
        log_error "容器启动失败"
        exit 1
    fi
}

# 等待服务启动
wait_for_service() {
    log_info "等待服务启动..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:${PORT}/api/health &>/dev/null; then
            log_success "服务已就绪"
            return 0
        fi
        echo -n "."
        sleep 1
        ((attempt++))
    done
    
    echo ""
    log_warn "服务启动可能需要更长时间，请在浏览器中访问验证"
    return 1
}

# 显示部署信息
show_info() {
    local server_ip=$(get_server_ip)
    
    echo ""
    print_line
    echo ""
    log_success "部署完成！"
    echo ""
    echo -e "  ${BLUE}访问地址：${NC} http://${server_ip}:${PORT}"
    echo ""
    echo -e "  ${BLUE}管理员密码：${NC} ${ADMIN_PASSWORD}"
    echo -e "  ${BLUE}数据目录：${NC} ${DATA_DIR}"
    echo -e "  ${BLUE}上传目录：${NC} ${UPLOADS_DIR}"
    echo ""
    print_line
    echo ""
    echo "常用命令："
    echo "  查看日志：  docker logs -f ${CONTAINER_NAME}"
    echo "  重启服务：  docker restart ${CONTAINER_NAME}"
    echo "  停止服务：  docker stop ${CONTAINER_NAME}"
    echo "  重新部署：  bash ${SCRIPT_DIR}/build.sh --rebuild"
    echo ""
}

# 重新部署（清理后重建）
rebuild() {
    log_warn "开始重新部署..."
    cleanup_old_container
    cleanup_old_image
    create_directories
    build_image
    run_container
    wait_for_service
    show_info
}

# 仅重启
restart() {
    log_info "重启容器..."
    docker restart ${CONTAINER_NAME}
    wait_for_service
    show_info
}

# 停止服务
stop() {
    log_info "停止容器..."
    docker stop ${CONTAINER_NAME} 2>/dev/null && log_success "容器已停止" || log_warn "容器未运行"
}

# 显示状态
status() {
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo -e "${GREEN}容器状态：运行中${NC}"
        docker ps --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        echo ""
        echo "最近日志（最后10行）："
        docker logs --tail 10 ${CONTAINER_NAME} 2>&1 | sed 's/^/  /'
    else
        echo -e "${YELLOW}容器状态：未运行${NC}"
        echo ""
        echo "如需部署，请运行：bash ${SCRIPT_DIR}/build.sh"
    fi
}

# 查看日志
logs() {
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        docker logs -f ${CONTAINER_NAME}
    else
        log_error "容器不存在，请先运行部署"
    fi
}

# 卸载
uninstall() {
    log_warn "即将卸载应用，这不会删除数据目录中的数据"
    read -p "确认卸载？(y/N): " confirm
    if [[ "$confirm" =~ ^[Yy]$ ]]; then
        cleanup_old_container
        cleanup_old_image
        log_success "卸载完成（数据目录未删除）"
    else
        log_info "已取消"
    fi
}

# 显示帮助
show_help() {
    echo ""
    echo "世界杯体彩收支统计排行榜 - 部署脚本"
    echo ""
    echo "用法: bash build.sh [命令]"
    echo ""
    echo "命令："
    echo "  (无参数)      首次部署或更新部署"
    echo "  --rebuild     重新构建镜像并部署（会删除旧容器和镜像）"
    echo "  --no-cache    构建时不使用缓存"
    echo "  restart       重启容器"
    echo "  stop          停止容器"
    echo "  status        查看容器状态"
    echo "  logs          查看容器日志"
    echo "  uninstall     卸载应用"
    echo "  help          显示帮助信息"
    echo ""
    echo "环境变量："
    echo "  ADMIN_PASSWORD         管理员密码（默认：159357）"
    echo "  AUTO_BACKUP_INTERVAL   自动备份间隔毫秒（默认：3600000 = 1小时）"
    echo "  MAX_BACKUPS            最大备份数量（默认：30）"
    echo ""
    echo "示例："
    echo "  ADMIN_PASSWORD=abc123 bash build.sh          # 使用自定义密码部署"
    echo "  bash build.sh --rebuild                     # 重新构建并部署"
    echo "  bash build.sh restart                       # 重启服务"
    echo ""
}

# 主函数
main() {
    echo ""
    print_line
    echo "  世界杯体彩收支统计排行榜 - 部署脚本"
    print_line
    echo ""
    
    case "${1:-}" in
        --rebuild)
            rebuild
            ;;
        --no-cache)
            check_docker
            cleanup_old_container
            cleanup_old_image
            create_directories
            build_image --no-cache
            run_container
            wait_for_service
            show_info
            ;;
        restart)
            restart
            ;;
        stop)
            stop
            ;;
        status)
            status
            ;;
        logs)
            logs
            ;;
        uninstall)
            uninstall
            ;;
        help|--help|-h)
            show_help
            ;;
        "")
            check_docker
            cleanup_old_container
            create_directories
            cleanup_old_image
            build_image
            run_container
            wait_for_service
            show_info
            ;;
        *)
            log_error "未知命令: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
