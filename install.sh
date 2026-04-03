#!/bin/bash

#
# Chaos Harness Installation Script (Marketplace Mode)
#
# This script installs Chaos Harness as a Claude Code plugin using the marketplace system.
# After installation, use slash commands like /chaos-harness:overview
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
MARKETPLACE_NAME="chaos-harness"
VERSION="1.0.0"

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}     Chaos Harness Installation Script          ${NC}"
echo -e "${GREEN}     Chaos demands order. Harness provides it.  ${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Get plugin cache directory
get_cache_dir() {
    echo "$HOME/.claude/plugins/cache/$MARKETPLACE_NAME/$PLUGIN_NAME/$VERSION"
}

get_marketplace_dir() {
    echo "$HOME/.claude/plugins/marketplaces/$MARKETPLACE_NAME"
}

# Install plugin
install_plugin() {
    echo -e "${YELLOW}Installing Chaos Harness plugin...${NC}"

    local cache_dir=$(get_cache_dir)
    local marketplace_dir=$(get_marketplace_dir)

    # Create marketplace directory
    mkdir -p "$marketplace_dir"

    # Copy all files to marketplace directory
    echo -e "${YELLOW}Copying to marketplace directory...${NC}"
    cp -r "$SCRIPT_DIR/.claude-plugin" "$marketplace_dir/"
    cp -r "$SCRIPT_DIR/skills" "$marketplace_dir/"

    if [ -f "$SCRIPT_DIR/CLAUDE.md" ]; then
        cp "$SCRIPT_DIR/CLAUDE.md" "$marketplace_dir/"
    fi

    if [ -f "$SCRIPT_DIR/README.md" ]; then
        cp "$SCRIPT_DIR/README.md" "$marketplace_dir/"
    fi

    if [ -d "$SCRIPT_DIR/templates" ]; then
        cp -r "$SCRIPT_DIR/templates" "$marketplace_dir/"
    fi

    if [ -d "$SCRIPT_DIR/commands" ]; then
        cp -r "$SCRIPT_DIR/commands" "$marketplace_dir/"
    fi

    if [ -d "$SCRIPT_DIR/hooks" ]; then
        cp -r "$SCRIPT_DIR/hooks" "$marketplace_dir/"
    fi

    # Create cache directory
    mkdir -p "$cache_dir"

    # Copy to cache directory
    echo -e "${YELLOW}Copying to cache directory...${NC}"
    cp -r "$marketplace_dir/.claude-plugin" "$cache_dir/"
    cp -r "$marketplace_dir/skills" "$cache_dir/"
    cp -r "$marketplace_dir/templates" "$cache_dir/"
    cp -r "$marketplace_dir/hooks" "$cache_dir/"
    [ -f "$marketplace_dir/CLAUDE.md" ] && cp "$marketplace_dir/CLAUDE.md" "$cache_dir/"
    [ -f "$marketplace_dir/README.md" ] && cp "$marketplace_dir/README.md" "$cache_dir/"
    [ -d "$marketplace_dir/commands" ] && cp -r "$marketplace_dir/commands" "$cache_dir/"

    # Register in known_marketplaces.json
    register_marketplace

    # Register in installed_plugins.json
    register_plugin

    # Enable in settings.json
    enable_plugin

    echo -e "${GREEN}[OK] Plugin installed successfully${NC}"
}

# Uninstall plugin
uninstall_plugin() {
    echo -e "${YELLOW}Uninstalling Chaos Harness...${NC}"

    local cache_dir=$(get_cache_dir)
    local cache_parent="$HOME/.claude/plugins/cache/$MARKETPLACE_NAME"
    local marketplace_dir=$(get_marketplace_dir)

    if [ -d "$cache_parent" ]; then
        rm -rf "$cache_parent"
        echo "Removed cache directory"
    fi

    if [ -d "$marketplace_dir" ]; then
        rm -rf "$marketplace_dir"
        echo "Removed marketplace directory"
    fi

    unregister_marketplace
    unregister_plugin
    disable_plugin

    echo -e "${GREEN}[OK] Plugin removed${NC}"
}

# Register marketplace in known_marketplaces.json
register_marketplace() {
    local marketplaces_file="$HOME/.claude/plugins/known_marketplaces.json"
    local marketplace_dir=$(get_marketplace_dir)
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

    echo -e "${YELLOW}Registering marketplace...${NC}"

    # Create file if not exists
    if [ ! -f "$marketplaces_file" ]; then
        mkdir -p "$(dirname "$marketplaces_file")"
        echo '{}' > "$marketplaces_file"
    fi

    # Use jq if available
    if command -v jq &> /dev/null; then
        local tmp_file="/tmp/km_$$.json"
        jq --arg name "$MARKETPLACE_NAME" --arg dir "$marketplace_dir" --arg ts "$timestamp" \
            '.[$name] = {
                "source": {
                    "source": "github",
                    "repo": "jeesoul/chaos-harness"
                },
                "installLocation": $dir,
                "lastUpdated": $ts
            }' "$marketplaces_file" > "$tmp_file" && cat "$tmp_file" > "$marketplaces_file" && rm -f "$tmp_file"
        echo "Marketplace registered in known_marketplaces.json"
    else
        echo -e "${YELLOW}Warning: jq not found. Please manually update known_marketplaces.json${NC}"
    fi
}

# Unregister marketplace
unregister_marketplace() {
    local marketplaces_file="$HOME/.claude/plugins/known_marketplaces.json"

    if [ -f "$marketplaces_file" ] && command -v jq &> /dev/null; then
        local tmp_file="/tmp/km_$$.json"
        jq --arg name "$MARKETPLACE_NAME" \
            'del(.[$name])' "$marketplaces_file" > "$tmp_file" && cat "$tmp_file" > "$marketplaces_file" && rm -f "$tmp_file"
        echo "Marketplace unregistered from known_marketplaces.json"
    fi
}

# Register plugin in installed_plugins.json
register_plugin() {
    local installed_file="$HOME/.claude/plugins/installed_plugins.json"
    local cache_dir=$(get_cache_dir)
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

    echo -e "${YELLOW}Registering plugin...${NC}"

    # Create file if not exists
    if [ ! -f "$installed_file" ]; then
        mkdir -p "$(dirname "$installed_file")"
        echo '{"version": 2, "plugins": {}}' > "$installed_file"
    fi

    # Use jq if available
    if command -v jq &> /dev/null; then
        local tmp_file="/tmp/ip_$$.json"
        local plugin_key="${PLUGIN_NAME}@${MARKETPLACE_NAME}"
        jq --arg key "$plugin_key" --arg path "$cache_dir" --arg ts "$timestamp" --arg ver "$VERSION" \
            '.plugins[$key] = [{
                "scope": "user",
                "installPath": $path,
                "version": $ver,
                "installedAt": $ts,
                "lastUpdated": $ts
            }]' "$installed_file" > "$tmp_file" && cat "$tmp_file" > "$installed_file" && rm -f "$tmp_file"
        echo "Plugin registered in installed_plugins.json"
    else
        echo -e "${YELLOW}Warning: jq not found. Please manually update installed_plugins.json${NC}"
    fi
}

# Unregister plugin
unregister_plugin() {
    local installed_file="$HOME/.claude/plugins/installed_plugins.json"

    if [ -f "$installed_file" ] && command -v jq &> /dev/null; then
        local tmp_file="/tmp/ip_$$.json"
        local plugin_key="${PLUGIN_NAME}@${MARKETPLACE_NAME}"
        jq --arg key "$plugin_key" \
            'del(.plugins[$key])' "$installed_file" > "$tmp_file" && cat "$tmp_file" > "$installed_file" && rm -f "$tmp_file"
        echo "Plugin unregistered from installed_plugins.json"
    fi
}

# Enable plugin in settings.json
enable_plugin() {
    local settings_file="$HOME/.claude/settings.json"

    echo -e "${YELLOW}Enabling plugin in settings...${NC}"

    if [ ! -f "$settings_file" ]; then
        mkdir -p "$(dirname "$settings_file")"
        echo '{"enabledPlugins": {}, "extraKnownMarketplaces": {}}' > "$settings_file"
    fi

    if command -v jq &> /dev/null; then
        local tmp_file="/tmp/settings_$$.json"
        local plugin_key="${PLUGIN_NAME}@${MARKETPLACE_NAME}"

        # Add to enabledPlugins
        jq --arg key "$plugin_key" \
            '.enabledPlugins[$key] = true' "$settings_file" > "$tmp_file" && cat "$tmp_file" > "$settings_file"

        # Add to extraKnownMarketplaces
        jq --arg name "$MARKETPLACE_NAME" \
            '.extraKnownMarketplaces[$name] = {
                "source": {
                    "repo": "jeesoul/chaos-harness",
                    "source": "github"
                }
            }' "$settings_file" > "$tmp_file" && cat "$tmp_file" > "$settings_file" && rm -f "$tmp_file"
        echo "Plugin enabled in settings.json"
    else
        echo -e "${YELLOW}Warning: jq not found. Please manually update settings.json${NC}"
    fi
}

# Disable plugin in settings.json
disable_plugin() {
    local settings_file="$HOME/.claude/settings.json"

    if [ -f "$settings_file" ] && command -v jq &> /dev/null; then
        local tmp_file="/tmp/settings_$$.json"
        local plugin_key="${PLUGIN_NAME}@${MARKETPLACE_NAME}"

        # Remove from enabledPlugins
        jq --arg key "$plugin_key" \
            'del(.enabledPlugins[$key])' "$settings_file" > "$tmp_file" && cat "$tmp_file" > "$settings_file"

        # Remove from extraKnownMarketplaces
        jq --arg name "$MARKETPLACE_NAME" \
            'del(.extraKnownMarketplaces[$name])' "$settings_file" > "$tmp_file" && cat "$tmp_file" > "$settings_file" && rm -f "$tmp_file"
        echo "Plugin disabled in settings.json"
    fi
}

# Show usage
show_usage() {
    echo ""
    echo -e "${GREEN}================================================${NC}"
    echo -e "${GREEN}  Installation Complete!                        ${NC}"
    echo -e "${GREEN}================================================${NC}"
    echo ""
    echo -e "${YELLOW}Available Slash Commands:${NC}"
    echo ""
    echo "  /chaos-harness:overview             # Main entry"
    echo "  /chaos-harness:project-scanner      # Scan project"
    echo "  /chaos-harness:version-locker       # Version management"
    echo "  /chaos-harness:harness-generator    # Generate constraints"
    echo "  /chaos-harness:workflow-supervisor  # Workflow management"
    echo "  /chaos-harness:iron-law-enforcer    # Iron law enforcement"
    echo "  /chaos-harness:plugin-manager       # Plugin management"
    echo "  /chaos-harness:hooks-manager        # Hooks management"
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