# Chaos Harness 插件系统设计

## 核心理念

**Harness 是核心，插件是扩展。**

所有插件必须：
1. 在 Harness 设定的环境中执行
2. 遵循 Harness 的铁律约束
3. 接受 Harness 的监督机制

```
┌─────────────────────────────────────────────────────────────┐
│                     Chaos Harness                           │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                    Iron Laws (铁律)                    │ │
│  │         所有插件必须遵守，无法绕过                      │ │
│  └───────────────────────────────────────────────────────┘ │
│                          │                                  │
│                          ▼                                  │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                  Plugin Manager                        │ │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │ │
│  │  │external │  │external │  │custom-  │  │  ...    │  │ │
│  │  │plugin-1 │  │plugin-2 │  │plugins  │  │         │  │ │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 插件配置格式

### plugins.yaml

```yaml
# Chaos Harness 插件配置

harness:
  version: "1.0.0"
  iron_laws: required    # 铁律始终启用
  supervisor: required   # 监督始终启用
  version_lock: required # 版本锁定始终启用

plugins:
  # 外部插件示例
  example-plugin:
    enabled: true
    source: github:owner/plugin
    version: ">=1.0.0"
    
    stages:
      - W01_requirements_design
      - W08_development
    
    skills:
      - skill-1
      - skill-2
    
    # Harness 约束
    constraints:
      enforce_iron_laws: true
      enforce_version_lock: true
      enforce_verification: true
```

## 插件来源

| 来源 | 格式 | 示例 |
|------|------|------|
| GitHub | `github:owner/repo` | `github:owner/plugin` |
| npm | `npm:package-name` | `npm:my-plugin` |
| 本地 | `local:/path` | `local:~/.claude/plugins/my-plugin` |
| URL | `url:https://...` | `url:https://example.com/plugin.tar.gz` |

## 约束注入机制

所有插件加载时自动注入约束：

```yaml
constraints:
  enforce_iron_laws: true     # 必须遵守 IL001-IL005
  enforce_version_lock: true  # 输出必须在版本目录下
  enforce_verification: true  # 完成需要验证证据
  enforce_supervisor: true    # 接受偷懒检测
```

插件拒绝接受约束 = 拒绝加载

## 阶段-插件映射

```yaml
stage_plugins:
  W08_development:
    required:
      - harness:iron-law-enforcer    # Harness 核心，始终必须
    optional:
      - external:skill-1             # 用户可选

  W09_code_review:
    required:
      - harness:iron-law-enforcer
    optional:
      - external:skill-2
```

## 插件元数据格式

```yaml
# plugin.yaml
name: my-plugin
version: 1.0.0
description: 我的插件

requires:
  harness: ">=1.0.0"
  iron_laws: true
  version_lock: true

provides:
  skills:
    - name: my-skill
      description: 描述
      triggers:
        - "触发词"

compatible_stages:
  - W08_development

accepts_constraints:
  - enforce_iron_laws
  - enforce_version_lock
  - enforce_verification
```

## 使用流程

### 安装插件

```
用户: 安装插件 github:owner/plugin

Claude: 正在安装...
        ✅ 已克隆
        ✅ 元数据验证通过
        ✅ 约束已注入
        
        可用 Skills: skill-1, skill-2
        默认阶段: W01, W08
        是否使用默认配置？
```

### 配置阶段

```
用户: plugin-1 只在开发阶段使用

Claude: 已更新配置：
        启用阶段: W08_development
```

### 查看插件

```
用户: 查看插件列表

Claude: ┌─────────────────────────────────────────────────┐
        │  Chaos Harness 插件状态                         │
        ├─────────────────────────────────────────────────┤
        │  插件        │ 版本  │ 状态   │ 阶段           │
        ├─────────────────────────────────────────────────┤
        │  harness-core│ 1.0.0 │ 🔒核心 │ 全部           │
        │  plugin-1    │ 1.0.0 │ ✅启用 │ W01,W08       │
        │  plugin-2    │ 1.0.0 │ ⏸️禁用 │ W03           │
        └─────────────────────────────────────────────────┘
```

## 铁律约束传递

```yaml
iron_law_propagation:
  core_iron_laws:
    - IL001  # 无版本锁定，不生成文档
    - IL002  # 无扫描结果，不生成Harness
    - IL003  # 无验证证据，不声称完成
    - IL004  # 无用户同意，不更改版本
    - IL005  # 无明确批准，不改高风险配置

  custom_iron_laws:
    inherit: true    # 继承用户自定义铁律
    enforce: warn    # 违反时行为
```

## 配置文件位置

```
~/.claude/harness/
├── plugins.yaml           # 插件配置
├── iron-laws.yaml         # 自定义铁律
├── plugin-log.json        # 执行日志
└── iron-law-log.json      # 铁律日志
```

## 约束执行流程

```
插件请求执行
     │
     ▼
检查铁律约束
     │
     ├─ IL001 检查 ──▶ 是否在版本目录？
     │                否 → 阻止
     │
     ├─ IL002 检查 ──▶ 是否有扫描结果？
     │                否 → 阻止
     │
     ├─ IL003 检查 ──▶ 是否有验证证据？
     │                否 → 阻止声称完成
     │
     ▼
允许执行
     │
     ▼
监督执行过程
     │
     ├─ 偷懒检测
     ├─ 绕过检测
     │
     ▼
完成（需验证证据）
```