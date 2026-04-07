# Auto Toolkit Installer

自动检测并安装 Chaos Harness 完整自动化工具链。

## 使用

```
/chaos-harness:auto-toolkit-installer [action] [tool]
```

**Actions:**
- `check` - 检测已安装工具
- `install` - 安装缺失工具
- `mirror` - 测试镜像速度并配置最优源

**Tools:**
- `skill-creator` - Skill 自动创建器
- `superpowers-chrome` - Chrome DevTools MCP
- `ui-ux-pro-max` - UI/UX 评审 + Playwright
- `webapp-testing` - Playwright 自动化测试
- `all` - 全部工具 (默认)

## 示例

```bash
# 检测当前环境
/chaos-harness:auto-toolkit-installer check

# 安装所有缺失工具
/chaos-harness:auto-toolkit-installer install

# 仅安装 skill-creator
/chaos-harness:auto-toolkit-installer install skill-creator

# 测试并配置最优镜像
/chaos-harness:auto-toolkit-installer mirror
```

执行此命令将加载 `skills/auto-toolkit-installer/SKILL.md`。