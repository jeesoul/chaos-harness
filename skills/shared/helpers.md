# Chaos Harness Shared Helpers

> 可复用模式，供所有 chaos-harness skills 引用

---

## 铁律操作

### Load-Iron-Laws

```
路径: templates/iron-laws.yaml
目的: 加载当前项目的铁律规则

步骤:
1. 读取 templates/iron-laws.yaml
2. 解析 YAML 提取规则列表
3. 返回 IronLaw[] 数组

返回结构:
- id: 铁律ID (IL001-IL006, IL-C001-IL-C099)
- rule: 规则描述
- severity: critical/warning/info/require
- check: 检查函数描述
```

### Check-Version-Lock

```
路径: output/{version}/VERSION-LOCK
目的: 验证版本锁定状态

步骤:
1. 检查 output/{version}/VERSION-LOCK 文件是否存在
2. 如果锁定，读取锁定版本号
3. 与请求版本比较
4. 返回 { locked: boolean, version?: string, lockedAt?: Date }
```

### Log-Iron-Law-Check

```
路径: output/{version}/iron-law-log.json
目的: 记录铁律检查结果

步骤:
1. 读取现有 iron-law-log.json 或创建新数组
2. 添加检查记录:
   {
     timestamp: ISO8601,
     iron_law: string,
     operation: string,
     check: string,
     result: 'pass' | 'fail' | 'warn',
     evidence?: string,
     details?: any
   }
3. 写回文件
```

---

## 工作流操作

### Load-Workflow-State

```
路径: output/{version}/workflow-state.yaml
目的: 获取当前工作流状态

步骤:
1. 读取 workflow-state.yaml
2. 解析 YAML 提取:
   - project_info
   - stages 状态
   - iron_laws_enforced
   - deliverables
3. 返回状态对象
```

### Update-Workflow-Stage

```
目的: 更新阶段状态

步骤:
1. 加载当前 workflow-state.yaml
2. 找到目标阶段
3. 更新:
   - status: 'pending' → 'in_progress' → 'completed'
   - output: 输出文件路径
   - completed_at: 时间戳
4. 保存文件
```

### Log-Workflow-Progress

```
路径: output/{version}/workflow-log.json
目的: 记录工作流进度

步骤:
1. 读取现有 workflow-log.json 或创建新数组
2. 添加进度记录:
   {
     timestamp: ISO8601,
     stage: string,
     event: 'start' | 'progress' | 'complete' | 'blocked',
     duration_ms?: number,
     details?: string
   }
3. 写回文件
```

---

## 偷懒检测操作

### Detect-Laziness-Pattern

```
目的: 检测偷懒模式 LP001-LP006

模式定义:
- LP001: 声称完成但无验证证据
- LP002: 跳过根因分析直接修复
- LP003: 长时间无产出
- LP004: 试图跳过测试
- LP005: 擅自更改版本号
- LP006: 自动处理高风险配置

步骤:
1. 分析当前操作上下文
2. 匹配偷懒模式特征
3. 返回 { detected: boolean, pattern?: string, severity?: string }
```

### Log-Laziness-Detection

```
路径: output/{version}/laziness-log.json
目的: 记录偷懒检测结果

步骤:
1. 读取现有 laziness-log.json 或创建新数组
2. 添加检测记录:
   {
     timestamp: ISO8601,
     pattern: string,
     severity: 'critical' | 'warning' | 'info',
     context: string,
     action_taken: string,
     resolved: boolean
   }
3. 写回文件
```

---

## 扫描结果操作

### Create-Scan-Result

```
路径: output/{version}/scan-result.json
目的: 创建项目扫描结果

步骤:
1. 检查 scan-result.json 是否存在
2. 如不存在，收集信息:
   - projectType: 检测项目类型
   - version: 当前版本
   - backendFiles: 后端文件数
   - frontendFiles: 前端文件数
   - jdk: JDK 版本
   - springBoot: Spring Boot 版本
   - scanTime: 扫描时间
3. 写入 scan-result.json
```

### Validate-Scan-Result

```
目的: 验证扫描结果有效性

步骤:
1. 检查 scan-result.json 存在
2. 验证必需字段:
   - projectType
   - version
   - scanTime
3. 返回 { valid: boolean, missing?: string[] }
```

---

## 学习记录操作

### Log-Learning-Entry

```
路径: output/{version}/learning-log.json
目的: 记录学习内容

步骤:
1. 读取现有 learning-log.json 或创建新数组
2. 添加学习记录:
   {
     timestamp: ISO8601,
     type: 'error' | 'iron_law_violation' | 'best_practice',
     context: string,
     lesson: string,
     prevention?: string
   }
3. 写回文件
```

---

## 文档操作

### Save-Stage-Document

```
目的: 保存阶段产出文档

步骤:
1. 确定输出路径:
   - output/{version}/docs/W{NN}-{stage-name}.md
2. 写入文档内容
3. 更新 workflow-state.yaml 中的 stage.output
4. 记录到 iron-law-log.json (IL001 检查)
```

### Validate-Deliverables

```
目的: 验证产出完整性

步骤:
1. 读取 workflow-state.yaml 的 deliverables 列表
2. 检查每个文件是否存在
3. 验证文件非空
4. 返回 { complete: boolean, missing: string[] }
```

---

## 效果追踪操作

### Update-Effectiveness-Log

```
路径: output/{version}/effectiveness-log.md
目的: 更新效果追踪日志

步骤:
1. 读取现有 effectiveness-log.md 或从模板创建
2. 更新统计:
   - 铁律触发次数
   - 防绕过触发次数
   - 偷懒模式检测次数
   - 阶段效果评分
3. 计算总体评分
4. 写回文件
```

---

## Token 优化模式

### 引用模式

```
不要在 skill 中嵌入完整指令:

✓ 好: "使用 helpers.md#Load-Iron-Laws 加载铁律"
✗ 差: [完整的50行铁律加载代码]
```

### 懒加载模式

```
仅在需要时加载内容:
1. 首先加载 SKILL.md (~2-3K tokens)
2. 需要详细信息时加载 REFERENCE.md
3. 特定查找时加载 resources/ 文件
4. 确定性操作运行 scripts/
```

---

## 错误处理

### Version-Lock-Violation

```
如果检测到版本锁定违规:
1. 阻止操作
2. 记录到 iron-law-log.json (result: 'fail')
3. 返回错误信息:
   "版本已锁定为 {locked_version}，不允许更改到 {requested_version}"
4. 提供: 使用新版本号或请求用户解锁
```

### Scan-Result-Missing

```
如果 scan-result.json 缺失:
1. 自动调用 Create-Scan-Result
2. 如果自动创建失败，提示用户运行 /chaos-harness:project-scanner
3. 记录到 iron-law-log.json
```

### Workflow-State-Inconsistent

```
如果工作流状态不一致:
1. 检查缺失的阶段
2. 询问用户是否补全或重新生成
3. 提供修复建议
```

---

## 引用指南

其他 skill 可以通过以下方式引用:

```markdown
铁律检查请参考 helpers.md#Load-Iron-Laws
工作流更新请参考 helpers.md#Update-Workflow-Stage
偷懒检测请参考 helpers.md#Detect-Laziness-Pattern
```

---

*此文档随 chaos-harness 版本更新*