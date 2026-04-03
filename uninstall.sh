#!/bin/bash

#
# Chaos Harness Uninstall Script
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PLUGIN_NAME="chaos-harness"
MARKETPLACE_NAME="chaos-harness"

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}     Chaos Harness Uninstall Script            ${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""

echo "Uninstalling Chaos Harness..."

# Remove cache directory
cache_parent="$HOME/.claude/plugins/cache/$MARKETPLACE_NAME"
if [[ -d "$cache_parent" ]]; then
    echo "Removing cache directory..."
    rm -rf "$cache_parent"
    echo -e "  ${GREEN}[OK]${NC} Cache removed"
else
    echo -e "  ${YELLOW}[SKIP]${NC} Cache directory not found"
fi

# Remove marketplace directory
marketplace_dir="$HOME/.claude/plugins/marketplaces/$MARKETPLACE_NAME"
if [[ -d "$marketplace_dir" ]]; then
    echo "Removing marketplace directory..."
    rm -rf "$marketplace_dir"
    echo -e "  ${GREEN}[OK]${NC} Marketplace removed"
else
    echo -e "  ${YELLOW}[SKIP]${NC} Marketplace directory not found"
fi

# Unregister from installed_plugins.json
echo "Unregistering from installed_plugins.json..."
installed_file="$HOME/.claude/plugins/installed_plugins.json"
if [[ -f "$installed_file" ]]; then
    if command -v jq &> /dev/null; then
        tmp_file="/tmp/ip_$$.json"
        jq 'del(.plugins["chaos-harness@chaos-harness"])' "$installed_file" > "$tmp_file" && cat "$tmp_file" > "$installed_file" && rm -f "$tmp_file"
        echo -e "  ${GREEN}[OK]${NC} Unregistered"
    else
        echo -e "  ${YELLOW}[WARN]${NC} jq not found, please manually update installed_plugins.json"
    fi
else
    echo -e "  ${YELLOW}[SKIP]${NC} File not found"
fi

# Unregister from known_marketplaces.json
echo "Unregistering from known_marketplaces.json..."
marketplace_file="$HOME/.claude/plugins/known_marketplaces.json"
if [[ -f "$marketplace_file" ]]; then
    if command -v jq &> /dev/null; then
        tmp_file="/tmp/km_$$.json"
        jq 'del(.["chaos-harness"])' "$marketplace_file" > "$tmp_file" && cat "$tmp_file" > "$marketplace_file" && rm -f "$tmp_file"
        echo -e "  ${GREEN}[OK]${NC} Unregistered"
    else
        echo -e "  ${YELLOW}[WARN]${NC} jq not found, please manually update known_marketplaces.json"
    fi
else
    echo -e "  ${YELLOW}[SKIP]${NC} File not found"
fi

# Disable in settings.json
echo "Disabling in settings.json..."
settings_file="$HOME/.claude/settings.json"
if [[ -f "$settings_file" ]]; then
    if command -v jq &> /dev/null; then
        tmp_file="/tmp/settings_$$.json"
        jq 'del(.enabledPlugins["chaos-harness@chaos-harness"]) | del(.extraKnownMarketplaces["chaos-harness"])' "$settings_file" > "$tmp_file" && cat "$tmp_file" > "$settings_file" && rm -f "$tmp_file"
        echo -e "  ${GREEN}[OK]${NC} Disabled"
    else
        echo -e "  ${YELLOW}[WARN]${NC} jq not found, please manually update settings.json"
    fi
else
    echo -e "  ${YELLOW}[SKIP]${NC} File not found"
fi

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}Uninstall Complete${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "Chaos Harness has been removed."
echo "Please restart Claude Code to complete the uninstallation."