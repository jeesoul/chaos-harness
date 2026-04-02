#!/bin/bash

#
# Chaos Harness 安装脚本
#
# 用法:
#   ./install.sh              # 安装到 Claude Code
#   ./install.sh --uninstall  # 从 Claude Code 卸载
#

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Chaos Harness 安装脚本                 ║${NC}"
echo -e "${GREEN}║     Chaos demands order. Harness provides it. ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_NAME="chaos-harness"

# 检测操作系统
detect_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "linux"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        echo "windows"
    else
        echo "unknown"
    fi
}

# 获取 Claude Code 配置目录
get_claude_config_dir() {
    local os=$(detect_os)
    case $os in
        macos)
            echo "$HOME/Library/Application Support/Claude"
            ;;
        linux)
            echo "$HOME/.config/Claude"
            ;;
        windows)
            echo "$APPDATA/Claude"
            ;;
        *)
            echo "$HOME/.claude"
            ;;
    esac
}

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

    # 复制 skills
    echo -e "${YELLOW}复制 skills...${NC}"
    cp -r "$SCRIPT_DIR/skills" "$target_dir/"

    # 复制 CLAUDE.md
    if [ -f "$SCRIPT_DIR/CLAUDE.md" ]; then
        cp "$SCRIPT_DIR/CLAUDE.md" "$target_dir/"
    fi

    echo -e "${GREEN}✓ 插件已安装到: $target_dir${NC}"
}

# 配置 MCP Server
configure_mcp() {
    echo -e "${YELLOW}配置 MCP Server...${NC}"

    local config_dir=$(get_claude_config_dir)
    local config_file="$config_dir/claude_desktop_config.json"

    # 创建配置目录
    mkdir -p "$config_dir"

    # 检查配置文件是否存在
    if [ ! -f "$config_file" ]; then
        echo -e "${YELLOW}创建配置文件...${NC}"
        echo '{}' > "$config_file"
    fi

    # 使用 node 检查并更新 JSON
    if command -v node &> /dev/null; then
        node -e "
            const fs = require('fs');
            const path = require('path');
            const configPath = '$config_file';
            const scriptDir = '$SCRIPT_DIR'.replace(/\\\\/g, '/');

            let config = {};
            try {
                config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            } catch (e) {
                config = {};
            }

            config.mcpServers = config.mcpServers || {};
            config.mcpServers['chaos-harness'] = {
                command: 'node',
                args: [path.join(scriptDir, 'bin', 'mcp-server.js')],
                cwd: scriptDir
            };

            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            console.log('✓ MCP Server 已配置');
        "
        echo -e "${GREEN}✓ 配置文件已更新: $config_file${NC}"
    else
        echo -e "${YELLOW}请手动添加以下配置到 $config_file:${NC}"
        echo ""
        echo '{'
        echo '  "mcpServers": {'
        echo '    "chaos-harness": {'
        echo '      "command": "node",'
        echo '      "args": ["'"$SCRIPT_DIR/bin/mcp-server.js"'"],'
        echo '      "cwd": "'"$SCRIPT_DIR"'"'
        echo '    }'
        echo '  }'
        echo '}'
    fi
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

    # 移除 MCP 配置
    local config_dir=$(get_claude_config_dir)
    local config_file="$config_dir/claude_desktop_config.json"

    if [ -f "$config_file" ] && command -v node &> /dev/null; then
        node -e "
            const fs = require('fs');
            const configPath = '$config_file';

            let config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            if (config.mcpServers && config.mcpServers['chaos-harness']) {
                delete config.mcpServers['chaos-harness'];
                fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
                console.log('✓ MCP 配置已移除');
            }
        "
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
    echo "1. 重启 Claude Code 使配置生效"
    echo ""
    echo "2. 在 Claude Code 中使用以下命令:"
    echo ""
    echo "   ${GREEN}# 扫描项目${NC}"
    echo "   帮我扫描当前项目"
    echo ""
    echo "   ${GREEN}# 生成 Harness${NC}"
    echo "   生成这个项目的 Harness"
    echo ""
    echo "   ${GREEN}# 检测偷懒模式${NC}"
    echo "   检测是否有偷懒行为"
    echo ""
    echo "   ${GREEN}# 创建工作流${NC}"
    echo "   创建一个工作流"
    echo ""
    echo "   ${GREEN}# 列出铁律${NC}"
    echo "   列出所有铁律"
    echo ""
    echo -e "${YELLOW}更多信息请查看:${NC}"
    echo "   README.md"
    echo "   CLAUDE.md"
    echo ""
}

# 主函数
main() {
    if [ "$1" == "--uninstall" ]; then
        uninstall_plugin
        echo -e "${GREEN}卸载完成${NC}"
        exit 0
    fi

    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}错误: 需要安装 Node.js${NC}"
        echo "请先安装 Node.js: https://nodejs.org/"
        exit 1
    fi

    # 检查是否已构建
    if [ ! -d "$SCRIPT_DIR/dist" ]; then
        echo -e "${YELLOW}项目未构建，正在构建...${NC}"
        cd "$SCRIPT_DIR"
        npm install
        npm run build
    fi

    # 安装插件
    install_plugin

    # 配置 MCP
    configure_mcp

    # 显示使用说明
    show_usage
}

main "$@"