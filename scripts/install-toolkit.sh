#!/bin/bash
# Chaos Harness Toolkit Installer Script
# 自动安装 Chaos Harness 依赖的工具链，支持镜像加速

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Mirror configuration
USE_MIRROR=false
MIRROR_GITHUB="kgithub.com"
MIRROR_NPM="registry.npmmirror.com"

# Parse arguments
TOOL_TO_INSTALL=""
while [[ $# -gt 0 ]]; do
    case $1 in
        --mirror|-m)
            USE_MIRROR=true
            shift
            ;;
        skill-creator|superpowers-chrome|ui-ux-pro-max|webapp-testing)
            TOOL_TO_INSTALL="$1"
            shift
            ;;
        install|check)
            COMMAND="$1"
            shift
            ;;
        *)
            shift
            ;;
    esac
done

# Default command
COMMAND="${COMMAND:-check}"

echo ""
echo "========================================"
echo "  Chaos Harness Toolkit Installer"
echo "========================================"
if [[ "$USE_MIRROR" == true ]]; then
    echo -e "  ${BLUE}镜像模式: 启用${NC}"
    echo "  GitHub 镜像: $MIRROR_GITHUB"
    echo "  npm 镜像: $MIRROR_NPM"
fi
echo "========================================"
echo ""

# Check if claude CLI is available
if ! command -v claude &> /dev/null; then
    echo -e "${RED}❌ Claude CLI 未找到${NC}"
    echo "请先安装 Claude Code: https://claude.ai/code"
    exit 1
fi

# Install single tool
install_tool() {
    local tool_name=$1
    local plugin_id=$2
    local github_repo=$3

    echo -e "${BLUE}正在安装 $tool_name...${NC}"

    if [[ "$USE_MIRROR" == true && -n "$github_repo" ]]; then
        # Clone from mirror
        local mirror_repo="${github_repo/github.com/$MIRROR_GITHUB}"
        local temp_dir="/tmp/${tool_name}-install"

        echo "  克隆镜像仓库: $mirror_repo"
        rm -rf "$temp_dir"
        git clone "https://$mirror_repo" "$temp_dir" 2>/dev/null || {
            echo -e "${YELLOW}⚠️  镜像克隆失败，尝试官方源...${NC}"
            git clone "https://$github_repo" "$temp_dir" 2>/dev/null || {
                echo -e "${RED}❌ 克隆失败${NC}"
                return 1
            }
        }

        # Add to marketplace and install
        echo "  注册本地 marketplace..."
        claude plugins marketplace add "$temp_dir" 2>/dev/null || true

        echo "  安装插件..."
        claude plugins install "$plugin_id" 2>/dev/null || {
            echo -e "${YELLOW}⚠️  安装失败，请手动安装${NC}"
            return 1
        }

        rm -rf "$temp_dir"
    else
        # Direct install
        echo "  安装插件..."
        claude plugins install "$plugin_id" 2>/dev/null || {
            echo -e "${YELLOW}⚠️  安装失败，请手动安装${NC}"
            return 1
        }
    fi

    echo -e "${GREEN}✅ $tool_name 安装成功${NC}"
    return 0
}

# Install npm-based tools
install_npm_tool() {
    local tool_name=$1
    local npm_package=$2

    echo -e "${BLUE}正在安装 $tool_name (npm)...${NC}"

    if [[ "$USE_MIRROR" == true ]]; then
        echo "  使用镜像: $MIRROR_NPM"
        npm install -g "$npm_package" --registry="https://$MIRROR_NPM" 2>/dev/null || {
            echo -e "${YELLOW}⚠️  npm 安装失败${NC}"
            return 1
        }
    else
        npm install -g "$npm_package" 2>/dev/null || {
            echo -e "${YELLOW}⚠️  npm 安装失败${NC}"
            return 1
        }
    fi

    echo -e "${GREEN}✅ $tool_name 安装成功${NC}"
    return 0
}

# Tool definitions
declare -A TOOLS=(
    ["skill-creator"]="claude-plugins-official:skill-creator|github.com/anthropics/claude-plugins-official"
    ["superpowers-chrome"]="superpowers-marketplace:superpowers-chrome|github.com/NicsterV2/superpowers-chrome"
    ["ui-ux-pro-max"]="ui-ux-pro-max-skill:ui-ux-pro-max|github.com/NicsterV2/ui-ux-pro-max-skill"
    ["webapp-testing"]="anthropics/skills:webapp-testing|github.com/anthropics/skills"
)

# Execute based on command
case "$COMMAND" in
    check)
        echo "=== 工具状态检测 ==="
        echo ""

        MISSING=0

        for tool in "${!TOOLS[@]}"; do
            if claude plugins list 2>/dev/null | grep -q "$tool"; then
                echo -e "${GREEN}✅ $tool${NC}: 已安装"
            else
                echo -e "${RED}❌ $tool${NC}: 未安装"
                MISSING=$((MISSING+1))
            fi
        done

        echo ""

        if [[ $MISSING -eq 0 ]]; then
            echo -e "${GREEN}✅ 所有工具已安装${NC}"
        else
            echo -e "${YELLOW}⚠️  缺失 $MISSING 个工具${NC}"
            echo ""
            echo "安装命令:"
            echo "  ./install-toolkit.sh install          # 官方源"
            echo "  ./install-toolkit.sh install --mirror # 镜像加速"
        fi
        ;;

    install)
        if [[ -n "$TOOL_TO_INSTALL" ]]; then
            # Install specific tool
            IFS='|' read -r plugin_id github_repo <<< "${TOOLS[$TOOL_TO_INSTALL]}"

            if [[ -z "$plugin_id" ]]; then
                echo -e "${RED}❌ 未知工具: $TOOL_TO_INSTALL${NC}"
                exit 1
            fi

            install_tool "$TOOL_TO_INSTALL" "$plugin_id" "$github_repo"
        else
            # Install all missing tools
            echo "=== 安装缺失工具 ==="
            echo ""

            for tool in "${!TOOLS[@]}"; do
                if ! claude plugins list 2>/dev/null | grep -q "$tool"; then
                    IFS='|' read -r plugin_id github_repo <<< "${TOOLS[$tool]}"
                    install_tool "$tool" "$plugin_id" "$github_repo"
                    echo ""
                fi
            done
        fi

        echo ""
        echo "========================================"
        echo -e "${GREEN}✅ 安装完成${NC}"
        echo "验证安装: ./install-toolkit.sh check"
        echo "========================================"
        ;;

    *)
        echo "用法: $0 {check|install} [--mirror] [tool-name]"
        echo ""
        echo "命令:"
        echo "  check          检测已安装工具"
        echo "  install        安装所有缺失工具"
        echo "  install <tool> 安装指定工具"
        echo ""
        echo "选项:"
        echo "  --mirror, -m   使用镜像加速"
        echo ""
        echo "可用工具:"
        echo "  skill-creator"
        echo "  superpowers-chrome"
        echo "  ui-ux-pro-max"
        echo "  webapp-testing"
        ;;
esac

exit 0