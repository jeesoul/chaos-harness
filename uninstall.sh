#!/usr/bin/env bash
# Chaos Harness v1.3.1 卸载脚本

set -e

echo "========================================="
echo " Chaos Harness v1.3.1 卸载"
echo "========================================="
echo ""

# 移除 marketplace
claude plugins marketplace remove chaos-harness 2>/dev/null || echo "  marketplace 已移除或不存在"

# 卸载插件
claude plugins uninstall chaos-harness@chaos-harness 2>/dev/null || echo "  插件已卸载或不存在"

echo ""
echo "========================================="
echo " 卸载完成"
echo "========================================="
echo ""
echo "如需清理本地数据，请手动删除："
echo "  instincts/  evals/  schemas/  output/"
echo ""
