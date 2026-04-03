#!/bin/bash
# Chaos Harness Toolkit Detection Script
# 自动检测 Chaos Harness 依赖的工具链

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "========================================"
echo "  Chaos Harness Toolkit Detection"
echo "========================================"
echo ""

# 检测函数
check_plugin() {
    local plugin_name=$1
    local install_cmd=$2

    if claude plugins list 2>/dev/null | grep -q "$plugin_name"; then
        echo -e "${GREEN}✅ $plugin_name${NC}: 已安装"
        return 0
    else
        echo -e "${RED}❌ $plugin_name${NC}: 未安装"
        echo -e "   ${BLUE}安装命令${NC}: $install_cmd"
        return 1
    fi
}

# 检测所有工具
echo "=== 工具检测 ==="
echo ""

MISSING=0

check_plugin "skill-creator" "claude plugins install skill-creator@claude-plugins-official" || MISSING=$((MISSING+1))
echo ""

check_plugin "superpowers-chrome" "claude plugins install superpowers-chrome@superpowers-marketplace" || MISSING=$((MISSING+1))
echo ""

check_plugin "ui-ux-pro-max" "claude plugins install ui-ux-pro-max@ui-ux-pro-max-skill" || MISSING=$((MISSING+1))
echo ""

check_plugin "webapp-testing" "claude plugins install webapp-testing@anthropics/skills" || MISSING=$((MISSING+1))
echo ""

# 网络检测
echo "=== 网络环境检测 ==="
echo ""

check_network() {
    local url=$1
    local name=$2

    if curl -s --max-time 5 "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $name${NC}: 可连接"
        return 0
    else
        echo -e "${YELLOW}⚠️  $name${NC}: 无法连接"
        return 1
    fi
}

check_network "https://github.com" "GitHub 官方" || true
check_network "https://kgithub.com" "KGitHub 镜像" || true
check_network "https://registry.npmmirror.com" "淘宝 npm 镜像" || true

echo ""

# Playwright 检测
echo "=== Playwright 环境 ==="
echo ""

if command -v npx &> /dev/null; then
    if npx playwright --version &> /dev/null; then
        PLAYWRIGHT_VERSION=$(npx playwright --version 2>/dev/null)
        echo -e "${GREEN}✅ Playwright${NC}: $PLAYWRIGHT_VERSION"
    else
        echo -e "${YELLOW}⚠️  Playwright${NC}: 未安装"
        echo -e "   ${BLUE}安装命令${NC}: npm install -D @playwright/test"
    fi
else
    echo -e "${RED}❌ npx${NC}: 未找到，请先安装 Node.js"
fi

echo ""

# 汇总
echo "========================================"
if [ $MISSING -eq 0 ]; then
    echo -e "${GREEN}✅ 所有工具已安装${NC}"
else
    echo -e "${YELLOW}⚠️  缺失 $MISSING 个工具${NC}"
    echo ""
    echo "快速安装所有缺失工具:"
    echo "  /chaos-harness:auto-toolkit-installer install"
    echo ""
    echo "使用镜像安装 (国内推荐):"
    echo "  /chaos-harness:auto-toolkit-installer install --mirror"
fi
echo "========================================"
echo ""