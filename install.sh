#!/bin/bash

#
# Chaos Harness 安装脚本
#
# 用法:
#   ./install.sh              # 安装到 Claude Code
#   ./install.sh --uninstall  # 从 Claude Code 卸载

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Chaos Harness 安装脚本                 ║${NC}"
echo -e "${GREEN}║     Chaos demands order. Harness provides it. ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_NAME="chaos-harness"

# 获取 Claude Code 插件目录
get_plugin_dir() {
    echo "$HOME/.claude/plugins"
}

# 安装插件
install_plugin() {
    echo -e "${YELLOW}正在安装 Chaos Harness 插件...${NC}"

    local plugin_dir=$(get_plugin_dir)
    local target_dir="$plugin_dir/$PLUGIN_NAME"

    # 创建插件目录
    mkdir -p "$plugin_dir"

    # 如果已存在，先删除
    if [ -d "$target_dir" ]; then
        echo -e "${YELLOW}删除旧版本...${NC}"
        rm -rf "$target_dir"
    fi

    # 创建目标目录
    mkdir -p "$target_dir"

    # 复制插件配置
    echo -e "${YELLOW}复制插件配置...${NC}"
    cp -r "$SCRIPT_DIR/.claude-plugin" "$target_dir/"

    # 复制 skills（核心！）
    echo -e "${YELLOW}复制 skills...${NC}"
    cp -r "$SCRIPT_DIR/skills" "$target_dir/"

    # 复制 CLAUDE.md
    if [ -f "$SCRIPT_DIR/CLAUDE.md" ]; then
        cp "$SCRIPT_DIR/CLAUDE.md" "$target_dir/"
    fi

    # 复制 README.md
    if [ -f "$SCRIPT_DIR/README.md" ]; then
        cp "$SCRIPT_DIR/README.md" "$target_dir/"
    fi

    # 复制 templates
    if [ -d "$SCRIPT_DIR/templates" ]; then
        cp -r "$SCRIPT_DIR/templates" "$target_dir/"
    fi

    echo -e "${GREEN}✓ 插件已安装到: $target_dir${NC}"
}

# 卸载插件
uninstall_plugin() {
    echo -e "${YELLOW}正在卸载 Chaos Harness...${NC}"

    local plugin_dir=$(get_plugin_dir)
    local target_dir="$plugin_dir/$PLUGIN_NAME"

    if [ -d "$target_dir" ]; then
        rm -rf "$target_dir"
        echo -e "${GREEN}✓ 插件已删除${NC}"
    else
        echo -e "${YELLOW}插件未安装${NC}"
    fi
}

# 显示使用说明
show_usage() {
    echo ""
    echo -e "${GREEN}══════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  安装完成！${NC}"
    echo -e "${GREEN}══════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}使用方式:${NC}"
    echo ""
    echo "1. 重启 Claude Code 或开始新会话"
    echo ""
    echo "2. Skills 会自动激活，直接对话即可："
    echo ""
    echo "   ${GREEN}# 扫描项目${NC}"
    echo "   帮我扫描当前项目"
    echo ""
    echo "   ${GREEN}# 生成 Harness${NC}"
    echo "   生成这个项目的 Harness"
    echo ""
    echo "   ${GREEN}# 版本管理${NC}"
    echo "   创建版本 v0.1"
    echo ""
    echo "   ${GREEN}# 工作流${NC}"
    echo "   创建工作流"
    echo ""
    echo "   ${GREEN}# 铁律${NC}"
    echo "   列出所有铁律"
    echo ""
    echo -e "${YELLOW}已安装的 Skills:${NC}"
    echo "   - project-scanner    (项目扫描)"
    echo "   - version-locker     (版本锁定)"
    echo "   - harness-generator  (Harness生成)"
    echo "   - workflow-supervisor (工作流监督)"
    echo "   - iron-law-enforcer  (铁律执行，支持自定义)"
    echo "   - plugin-manager     (插件管理)"
    echo ""
    echo -e "${YELLOW}插件管理:${NC}"
    echo "   查看插件列表"
    echo "   安装插件 github:owner/plugin"
    echo "   添加铁律：周五禁止部署"
    echo ""
}

# 主函数
main() {
    if [ "$1" == "--uninstall" ]; then
        uninstall_plugin
        echo -e "${GREEN}卸载完成${NC}"
        exit 0
    fi

    # 安装插件
    install_plugin

    # 显示使用说明
    show_usage
}

main "$@"