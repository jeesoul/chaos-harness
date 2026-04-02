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

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}     Chaos Harness Installation Script          ${NC}"
echo -e "${GREEN}     Chaos demands order. Harness provides it.  ${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Get Claude Code skills directory
get_skills_dir() {
    echo "$HOME/.claude/skills"
}

# Install skills
install_skills() {
    echo -e "${YELLOW}Installing Chaos Harness skills...${NC}"

    local skills_dir=$(get_skills_dir)

    # Create skills directory if not exists
    mkdir -p "$skills_dir"

    # Install each skill
    for skill_path in "$SCRIPT_DIR/skills"/*/; do
        if [ -d "$skill_path" ]; then
            skill_name=$(basename "$skill_path")
            echo -e "${YELLOW}  Installing: $skill_name${NC}"

            # Remove old version if exists
            if [ -d "$skills_dir/$skill_name" ]; then
                rm -rf "$skills_dir/$skill_name"
            fi

            # Copy skill
            cp -r "$skill_path" "$skills_dir/"
        fi
    done

    echo -e "${GREEN}[OK] Skills installed to: $skills_dir${NC}"
}

# Uninstall skills
uninstall_skills() {
    echo -e "${YELLOW}Uninstalling Chaos Harness skills...${NC}"

    local skills_dir=$(get_skills_dir)

    # List of skills to remove
    local skills=("overview" "project-scanner" "version-locker" "harness-generator"
                  "workflow-supervisor" "iron-law-enforcer" "plugin-manager")

    for skill in "${skills[@]}"; do
        if [ -d "$skills_dir/$skill" ]; then
            echo -e "${YELLOW}  Removing: $skill${NC}"
            rm -rf "$skills_dir/$skill"
        fi
    done

    echo -e "${GREEN}[OK] Skills removed${NC}"
}

# Show usage
show_usage() {
    echo ""
    echo -e "${GREEN}================================================${NC}"
    echo -e "${GREEN}  Installation Complete!                        ${NC}"
    echo -e "${GREEN}================================================${NC}"
    echo ""
    echo -e "${YELLOW}Available Skills:${NC}"
    echo "   - overview             (Main entry, Iron Laws)"
    echo "   - project-scanner      (Project scanning)"
    echo "   - version-locker       (Version locking)"
    echo "   - harness-generator    (Harness generation)"
    echo "   - workflow-supervisor  (Workflow supervision)"
    echo "   - iron-law-enforcer    (Iron law enforcement)"
    echo "   - plugin-manager       (Plugin management)"
    echo ""
    echo -e "${YELLOW}Usage:${NC}"
    echo ""
    echo "1. Restart Claude Code or start a new session"
    echo ""
    echo "2. Natural language triggers:"
    echo "   - scan current project"
    echo "   - generate harness for this project"
    echo "   - create version v0.1"
    echo "   - list all iron laws"
    echo ""
    echo "3. The skills will auto-activate based on context"
    echo ""
}

# Main
main() {
    if [ "$1" == "--uninstall" ]; then
        uninstall_skills
        echo -e "${GREEN}Uninstall complete${NC}"
        exit 0
    fi

    # Install skills
    install_skills

    # Show usage
    show_usage
}

main "$@"