#!/bin/bash

#
# Chaos Harness Diagnostic Script
# Checks installation and reports issues
#

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
echo -e "${GREEN}     Chaos Harness Diagnostic Script            ${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""

cache_dir="$HOME/.claude/plugins/cache/$MARKETPLACE_NAME/$PLUGIN_NAME/$VERSION"
marketplace_dir="$HOME/.claude/plugins/marketplaces/$MARKETPLACE_NAME"

echo "[1] Checking installation directories..."
echo ""

# Check cache directory
echo "Cache Directory:"
if [[ -d "$cache_dir" ]]; then
    echo -e "  ${GREEN}[OK]${NC} $cache_dir"
else
    echo -e "  ${RED}[ERROR] NOT FOUND: $cache_dir${NC}"
    echo "  Please run install.sh first."
    exit 1
fi

echo ""
echo "[2] Checking critical files..."
echo ""

ERRORS=0

# Check plugin.json
if [[ -f "$cache_dir/.claude-plugin/plugin.json" ]]; then
    echo -e "  ${GREEN}[OK]${NC} .claude-plugin/plugin.json"
else
    echo -e "  ${RED}[ERROR]${NC} Missing: .claude-plugin/plugin.json"
    ((ERRORS++))
fi

# Check skills
if [[ -f "$cache_dir/skills/overview/SKILL.md" ]]; then
    echo -e "  ${GREEN}[OK]${NC} skills/overview/SKILL.md"
else
    echo -e "  ${RED}[ERROR]${NC} Missing: skills/overview/SKILL.md"
    ((ERRORS++))
fi

if [[ -f "$cache_dir/skills/project-scanner/SKILL.md" ]]; then
    echo -e "  ${GREEN}[OK]${NC} skills/project-scanner/SKILL.md"
else
    echo -e "  ${RED}[ERROR]${NC} Missing: skills/project-scanner/SKILL.md"
    ((ERRORS++))
fi

# Check commands
if [[ -f "$cache_dir/commands/overview.md" ]]; then
    echo -e "  ${GREEN}[OK]${NC} commands/overview.md"
else
    echo -e "  ${RED}[ERROR]${NC} Missing: commands/overview.md"
    ((ERRORS++))
fi

# Check hooks
if [[ -f "$cache_dir/hooks/hooks.json" ]]; then
    echo -e "  ${GREEN}[OK]${NC} hooks/hooks.json"
else
    echo -e "  ${RED}[ERROR]${NC} Missing: hooks/hooks.json"
    ((ERRORS++))
fi

echo ""
echo "[3] Checking plugin registration..."
echo ""

# Check installed_plugins.json
installed_file="$HOME/.claude/plugins/installed_plugins.json"
if [[ -f "$installed_file" ]]; then
    if grep -q "chaos-harness@chaos-harness" "$installed_file" 2>/dev/null; then
        echo -e "  ${GREEN}[OK]${NC} Registered in installed_plugins.json"
    else
        echo -e "  ${RED}[ERROR]${NC} Not registered in installed_plugins.json"
        ((ERRORS++))
    fi
else
    echo -e "  ${RED}[ERROR]${NC} installed_plugins.json not found"
    ((ERRORS++))
fi

# Check known_marketplaces.json
marketplace_file="$HOME/.claude/plugins/known_marketplaces.json"
if [[ -f "$marketplace_file" ]]; then
    if grep -q "chaos-harness" "$marketplace_file" 2>/dev/null; then
        echo -e "  ${GREEN}[OK]${NC} Registered in known_marketplaces.json"
    else
        echo -e "  ${YELLOW}[WARN]${NC} Not found in known_marketplaces.json"
    fi
else
    echo -e "  ${YELLOW}[WARN]${NC} known_marketplaces.json not found"
fi

echo ""
echo "[4] Checking settings..."
echo ""

settings_file="$HOME/.claude/settings.json"
if [[ -f "$settings_file" ]]; then
    if grep -q "chaos-harness@chaos-harness" "$settings_file" 2>/dev/null; then
        echo -e "  ${GREEN}[OK]${NC} Enabled in settings.json"
    else
        echo -e "  ${RED}[ERROR]${NC} Not enabled in settings.json"
        ((ERRORS++))
    fi
else
    echo -e "  ${RED}[ERROR]${NC} settings.json not found"
    ((ERRORS++))
fi

echo ""
echo -e "${GREEN}================================================${NC}"
echo "Summary"
echo -e "${GREEN}================================================${NC}"

if [[ $ERRORS -eq 0 ]]; then
    echo ""
    echo -e "${GREEN}[SUCCESS] All checks passed!${NC}"
    echo ""
    echo "Installation looks correct. If commands still don't work:"
    echo "  1. Close ALL Claude Code windows"
    echo "  2. Start a NEW Claude Code session"
    echo "  3. Try: /chaos-harness:overview"
    echo ""
    echo "If still not working, the skill might need a restart:"
    echo "  - In Claude Code, type: /skills"
    echo "  - Check if chaos-harness appears in the list"
else
    echo ""
    echo -e "${RED}[FAILED] Found $ERRORS error(s)${NC}"
    echo ""
    echo "To fix:"
    echo "  1. Close Claude Code"
    echo "  2. Run: ./uninstall.sh"
    echo "  3. Run: ./install.sh"
    echo "  4. Start a NEW Claude Code session"
fi

echo -e "${GREEN}================================================${NC}"