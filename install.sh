#!/bin/bash

#
# Chaos Harness Installation Script
#
# Usage:
#   ./install.sh              # Install to Claude Code
#   ./install.sh --uninstall  # Uninstall from Claude Code

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PLUGIN_NAME="chaos-harness"
VERSION="1.0.0"

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}     Chaos Harness Installation Script          ${NC}"
echo -e "${GREEN}     Chaos demands order. Harness provides it.  ${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Get plugin cache directory
get_plugin_dir() {
    echo "$HOME/.claude/plugins/cache/local/$PLUGIN_NAME/$VERSION"
}

# Install plugin
install_plugin() {
    echo -e "${YELLOW}Installing Chaos Harness plugin...${NC}"

    local plugin_dir=$(get_plugin_dir)
    local parent_dir=$(dirname "$plugin_dir")

    # Create parent directories
    mkdir -p "$parent_dir"

    # Remove old version if exists
    if [ -d "$plugin_dir" ]; then
        echo -e "${YELLOW}Removing old version...${NC}"
        rm -rf "$plugin_dir"
    fi

    # Create plugin directory
    mkdir -p "$plugin_dir"

    # Copy plugin files
    echo -e "${YELLOW}Copying plugin files...${NC}"
    cp -r "$SCRIPT_DIR/.claude-plugin" "$plugin_dir/"
    cp -r "$SCRIPT_DIR/skills" "$plugin_dir/"

    if [ -f "$SCRIPT_DIR/CLAUDE.md" ]; then
        cp "$SCRIPT_DIR/CLAUDE.md" "$plugin_dir/"
    fi

    if [ -f "$SCRIPT_DIR/README.md" ]; then
        cp "$SCRIPT_DIR/README.md" "$plugin_dir/"
    fi

    if [ -d "$SCRIPT_DIR/templates" ]; then
        cp -r "$SCRIPT_DIR/templates" "$plugin_dir/"
    fi

    # Register plugin
    register_plugin

    echo -e "${GREEN}[OK] Plugin installed to: $plugin_dir${NC}"
}

# Uninstall plugin
uninstall_plugin() {
    echo -e "${YELLOW}Uninstalling Chaos Harness...${NC}"

    local plugin_dir=$(get_plugin_dir)

    if [ -d "$plugin_dir" ]; then
        rm -rf "$plugin_dir"
        unregister_plugin
        echo -e "${GREEN}[OK] Plugin removed${NC}"
    else
        echo -e "${YELLOW}Plugin not installed${NC}"
    fi
}

# Register plugin in installed_plugins.json
register_plugin() {
    local installed_file="$HOME/.claude/plugins/installed_plugins.json"
    local plugin_dir=$(get_plugin_dir)
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

    echo -e "${YELLOW}Registering plugin...${NC}"

    # Create file if not exists
    if [ ! -f "$installed_file" ]; then
        mkdir -p "$(dirname "$installed_file")"
        echo '{"version": 2, "plugins": {}}' > "$installed_file"
    fi

    # Use jq if available
    if command -v jq &> /dev/null; then
        local tmp_file=$(mktemp)
        jq --arg path "$plugin_dir" --arg ts "$timestamp" \
            '.plugins["chaos-harness@local"] = [{
                "scope": "user",
                "installPath": $path,
                "version": "'"$VERSION"'",
                "installedAt": $ts,
                "lastUpdated": $ts
            }]' "$installed_file" > "$tmp_file" && mv "$tmp_file" "$installed_file"
    else
        echo -e "${YELLOW}Note: jq not found. Plugin registered but may need manual verification.${NC}"
    fi
}

# Unregister plugin
unregister_plugin() {
    local installed_file="$HOME/.claude/plugins/installed_plugins.json"

    if [ -f "$installed_file" ] && command -v jq &> /dev/null; then
        local tmp_file=$(mktemp)
        jq 'del(.plugins["chaos-harness@local"])' "$installed_file" > "$tmp_file" && mv "$tmp_file" "$installed_file"
    fi
}

# Show usage
show_usage() {
    echo ""
    echo -e "${GREEN}================================================${NC}"
    echo -e "${GREEN}  Installation Complete!                        ${NC}"
    echo -e "${GREEN}================================================${NC}"
    echo ""
    echo -e "${YELLOW}Available Commands:${NC}"
    echo ""
    echo "  /chaos-harness:overview             # Main entry"
    echo "  /chaos-harness:project-scanner      # Scan project"
    echo "  /chaos-harness:version-locker       # Version management"
    echo "  /chaos-harness:harness-generator    # Generate constraints"
    echo "  /chaos-harness:workflow-supervisor  # Workflow management"
    echo "  /chaos-harness:iron-law-enforcer    # Iron law enforcement"
    echo "  /chaos-harness:plugin-manager       # Plugin management"
    echo ""
    echo -e "${YELLOW}Natural Language Triggers:${NC}"
    echo "  - 'scan current project'"
    echo "  - 'generate harness for this project'"
    echo "  - 'create version v0.1'"
    echo "  - 'list all iron laws'"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "  1. Restart Claude Code or start a new session"
    echo "  2. Try: /chaos-harness:overview"
    echo ""
}

# Main
main() {
    if [ "$1" == "--uninstall" ]; then
        uninstall_plugin
        echo -e "${GREEN}Uninstall complete${NC}"
        exit 0
    fi

    install_plugin
    show_usage
}

main "$@"