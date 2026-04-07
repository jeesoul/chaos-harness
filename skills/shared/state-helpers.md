# 状态辅助函数 (State Helpers)

共享的状态写入和读取函数，所有 skill 都应使用这些函数来保证状态一致性。

---

## 状态文件路径

```typescript
// 全局状态
const GLOBAL_STATE_DIR = "~/.claude/harness"
const IRON_LAW_LOG = `${GLOBAL_STATE_DIR}/iron-law-log.json`
const LEARNING_LOG = `${GLOBAL_STATE_DIR}/learning-log.json`
const LAZINESS_LOG = `${GLOBAL_STATE_DIR}/laziness-log.json`
const WORKFLOW_LOG = `${GLOBAL_STATE_DIR}/workflow-log.json`
const TRIGGER_LOG = `${GLOBAL_STATE_DIR}/trigger-log.json`

// 项目状态
const PROJECT_STATE_DIR = ".chaos-harness"
const PROJECT_STATE = `${PROJECT_STATE_DIR}/state.json`
const SCAN_RESULT = `${PROJECT_STATE_DIR}/scan-result.json`
const DECISIONS_LOG = `${PROJECT_STATE_DIR}/decisions-log.json`

// 版本状态
const getOutputPath = (version: string) => `output/${version}`
const EFFECTIVENESS_LOG = (version: string) => `${getOutputPath(version)}/effectiveness-log.md`
const REVIEW_LOG = (version: string) => `${getOutputPath(version)}/review-log.md`
```

---

## 通用写入函数

### appendToJsonLog

```typescript
/**
 * 追加记录到 JSON 日志文件
 * @param filePath 日志文件路径
 * @param entry 要追加的记录
 */
async function appendToJsonLog(filePath: string, entry: object): Promise<void> {
  // 1. 读取现有日志
  const content = await fs.readFile(filePath, 'utf-8').catch(() => '[]')
  const log = JSON.parse(content)

  // 2. 添加时间戳
  entry.timestamp = new Date().toISOString()

  // 3. 追加记录
  log.push(entry)

  // 4. 写回文件
  await fs.writeFile(filePath, JSON.stringify(log, null, 2))
}
```

### appendToMarkdownLog

```typescript
/**
 * 追加内容到 Markdown 日志文件
 * @param filePath 日志文件路径
 * @param content Markdown 内容
 */
async function appendToMarkdownLog(filePath: string, content: string): Promise<void> {
  // 1. 检查文件是否存在
  const exists = await fs.access(filePath).then(() => true).catch(() => false)

  // 2. 如果不存在，创建并写入标题
  if (!exists) {
    await fs.writeFile(filePath, `# 效果追踪日志\n\n创建于: ${new Date().toISOString()}\n\n---\n\n`)
  }

  // 3. 追加内容
  const timestamp = new Date().toISOString()
  await fs.appendFile(filePath, `\n## ${timestamp}\n\n${content}\n\n---\n`)
}
```

---

## 专用状态写入函数

### Update-Project-State

```typescript
/**
 * 更新项目状态
 * @param updates 要更新的字段
 */
async function updateProjectState(updates: Partial<ProjectState>): Promise<void> {
  const state = await readProjectState()

  // 合并更新
  Object.assign(state, updates, {
    last_session: new Date().toISOString()
  })

  // 写回文件
  await fs.writeFile(PROJECT_STATE, JSON.stringify(state, null, 2))
}
```

### Update-Stage-Status

```typescript
/**
 * 更新阶段状态
 * @param stage 阶段 ID
 * @param status 状态 (completed | skipped | blocked)
 * @param output 输出路径（可选）
 */
async function updateStageStatus(
  stage: string,
  status: 'completed' | 'skipped' | 'blocked',
  output?: string
): Promise<void> {
  const state = await readProjectState()

  if (status === 'completed') {
    state.workflow.stages_completed = state.workflow.stages_completed || []
    state.workflow.stages_completed.push({
      stage,
      completed_at: new Date().toISOString(),
      output_path: output
    })
  } else if (status === 'skipped') {
    state.workflow.stages_skipped = state.workflow.stages_skipped || []
    state.workflow.stages_skipped.push({
      stage,
      skipped_at: new Date().toISOString()
    })
  }

  // 从 pending 移除
  state.workflow.stages_pending = (state.workflow.stages_pending || [])
    .filter(s => s !== stage)

  // 更新当前阶段
  const nextStage = getNextStage(stage)
  if (nextStage) {
    state.workflow.current_stage = nextStage
    state.workflow.stage_start_time = new Date().toISOString()
  }

  state.last_session = new Date().toISOString()
  await fs.writeFile(PROJECT_STATE, JSON.stringify(state, null, 2))

  // 同时写入 workflow-log
  await appendToJsonLog(WORKFLOW_LOG, {
    event: 'stage_status_update',
    stage,
    status,
    timestamp: new Date().toISOString()
  })
}
```

### Log-Iron-Law-Trigger

```typescript
/**
 * 记录铁律触发
 * @param ironLawId 铁律 ID
 * @param context 上下文
 * @param action 采取的动作
 */
async function logIronLawTrigger(
  ironLawId: string,
  context: string,
  action: 'warn' | 'block' | 'pressure'
): Promise<void> {
  await appendToJsonLog(IRON_LAW_LOG, {
    iron_law_id: ironLawId,
    context,
    action,
    timestamp: new Date().toISOString()
  })
}
```

### Log-Laziness-Pattern

```typescript
/**
 * 记录偷懒模式
 * @param agentId Agent ID
 * @param patternId 偷懒模式 ID
 * @param context 上下文
 */
async function logLazinessPattern(
  agentId: string,
  patternId: string,
  context: string
): Promise<void> {
  await appendToJsonLog(LAZINESS_LOG, {
    agent_id: agentId,
    pattern_id: patternId,
    context,
    timestamp: new Date().toISOString()
  })
}
```

### Update-Effectiveness-Log

```typescript
/**
 * 更新效果日志
 * @param version 版本号
 * @param content Markdown 内容
 */
async function updateEffectivenessLog(version: string, content: string): Promise<void> {
  await appendToMarkdownLog(EFFECTIVENESS_LOG(version), content)
}
```

### Log-Review-Complete

```typescript
/**
 * 记录评审完成
 * @param version 版本号
 * @param stage 阶段
 * @param result 评审结果
 */
async function logReviewComplete(
  version: string,
  stage: string,
  result: {
    agents: string[]
    score: number
    controversies: number
    risks: number
    user_confirmed: boolean
  }
): Promise<void> {
  const content = `
## 评审记录 - ${stage}

**时间**: ${new Date().toISOString()}

**参与者**: ${result.agents.join(', ')}

**评分**: ${result.score}/10

**争议点**: ${result.controversies}

**风险点**: ${result.risks}

**用户确认**: ${result.user_confirmed ? '✅' : '❌'}
`

  await appendToMarkdownLog(REVIEW_LOG(version), content)

  // 同时更新工作流状态
  await updateStageStatus(stage, 'completed')
}
```

### Log-Agent-Team-Execution

```typescript
/**
 * 记录 Agent Team 执行
 * @param version 版本号
 * @param execution 执行详情
 */
async function logAgentTeamExecution(
  version: string,
  execution: {
    stage: string
    agents: Array<{
      id: string
      role: string
      status: string
      duration: number
    }>
    total_duration: number
    violations: number
    whip_count: number
  }
): Promise<void> {
  const content = `
## Agent Team 执行记录

**阶段**: ${execution.stage}

**执行时间**: ${new Date().toISOString()}

**总耗时**: ${execution.total_duration}ms

### Agent 状态

| Agent | 角色 | 状态 | 耗时 |
|-------|------|------|------|
${execution.agents.map(a => `| ${a.id} | ${a.role} | ${a.status} | ${a.duration}ms |`).join('\n')}

**违规次数**: ${execution.violations}

**鞭策次数**: ${execution.whip_count}
`

  await updateEffectivenessLog(version, content)
}
```

---

## 使用示例

### 在 workflow-supervisor 中

```markdown
阶段完成时：
1. 调用 Update-Stage-Status(stage, 'completed', outputPath)
2. 调用 Update-Effectiveness-Log(version, content)
```

### 在 agent-team-orchestrator 中

```markdown
Agent Team 执行后：
1. 调用 Log-Agent-Team-Execution(version, execution)
2. 如果检测到偷懒，调用 Log-Laziness-Pattern(agentId, patternId, context)
```

### 在 collaboration-reviewer 中

```markdown
评审完成后：
1. 调用 Log-Review-Complete(version, stage, result)
```

### 在 iron-law-enforcer 中

```markdown
铁律触发时：
1. 调用 Log-Iron-Law-Trigger(ironLawId, context, action)
```

---

## 状态读取函数

### Read-Project-State

```typescript
async function readProjectState(): Promise<ProjectState> {
  const content = await fs.readFile(PROJECT_STATE, 'utf-8')
  return JSON.parse(content)
}
```

### Get-Current-Version

```typescript
async function getCurrentVersion(): Promise<string | null> {
  const state = await readProjectState()
  return state.current_version
}
```

### Get-Current-Stage

```typescript
async function getCurrentStage(): Promise<string> {
  const state = await readProjectState()
  return state.workflow?.current_stage || 'W01'
}
```