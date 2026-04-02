/**
 * Agent Team Management
 *
 * M5: Agent Team管理模块
 * 支持团队创建、任务分配、状态更新
 */

import {
  AgentRole,
  AgentTeamMember,
  ProjectScale,
  WorkflowStage,
  LazinessPatternId
} from './types.js';
import {
  getRequiredRoles,
  getStageDefinition
} from './stages.js';

/**
 * 默认Agent技能映射
 */
const DEFAULT_SKILLS: Record<AgentRole, string[]> = {
  architect: [
    'system-design',
    'architecture-review',
    'technical-decision',
    'risk-assessment'
  ],
  backend_dev: [
    'coding',
    'testing',
    'debugging',
    'api-implementation',
    'database-design'
  ],
  frontend_dev: [
    'ui-design',
    'coding',
    'testing',
    'component-design',
    'state-management'
  ],
  tester: [
    'test-design',
    'test-execution',
    'bug-reporting',
    'performance-testing',
    'automation'
  ],
  supervisor: [
    'monitoring',
    'coordination',
    'quality-assurance',
    'violation-detection',
    'intervention'
  ]
};

/**
 * 默认职责映射
 */
const DEFAULT_RESPONSIBILITIES: Record<AgentRole, string[]> = {
  architect: [
    'Design system architecture',
    'Review technical decisions',
    'Create architecture documentation',
    'Approve design changes'
  ],
  backend_dev: [
    'Implement backend logic',
    'Write unit tests',
    'Fix bugs',
    'Optimize performance'
  ],
  frontend_dev: [
    'Implement UI components',
    'Write frontend tests',
    'Fix UI bugs',
    'Optimize user experience'
  ],
  tester: [
    'Design test cases',
    'Execute tests',
    'Report bugs',
    'Validate fixes'
  ],
  supervisor: [
    'Monitor workflow progress',
    'Detect laziness patterns',
    'Coordinate team members',
    'Enforce iron laws'
  ]
};

/**
 * Agent Team 管理器
 */
export class AgentTeamManager {
  members: AgentTeamMember[] = [];
  taskAssignments: Map<string, string[]> = new Map(); // agentId -> taskIds
  roleAssignments: Map<AgentRole, string[]> = new Map(); // role -> agentIds

  /**
   * 创建团队（根据项目规模）
   */
  createTeam(
    scale: ProjectScale,
    customConfig?: Partial<{
      architectCount: number;
      backendDevCount: number;
      frontendDevCount: number;
      testerCount: number;
      enableSupervisor: boolean;
    }>
  ): AgentTeamMember[] {
    // 根据规模确定团队配置
    const config = this.getTeamConfig(scale, customConfig);

    this.members = [];
    this.taskAssignments.clear();
    this.roleAssignments.clear();

    // 创建架构师
    for (let i = 0; i < config.architectCount; i++) {
      const member = this.createMember('architect', i);
      this.members.push(member);
      this.addToRole('architect', member.id);
    }

    // 创建后端开发
    for (let i = 0; i < config.backendDevCount; i++) {
      const member = this.createMember('backend_dev', i);
      this.members.push(member);
      this.addToRole('backend_dev', member.id);
    }

    // 创建前端开发
    for (let i = 0; i < config.frontendDevCount; i++) {
      const member = this.createMember('frontend_dev', i);
      this.members.push(member);
      this.addToRole('frontend_dev', member.id);
    }

    // 创建测试工程师
    for (let i = 0; i < config.testerCount; i++) {
      const member = this.createMember('tester', i);
      this.members.push(member);
      this.addToRole('tester', member.id);
    }

    // 创建监工（如果启用）
    if (config.enableSupervisor) {
      const member = this.createMember('supervisor', 0);
      this.members.push(member);
      this.addToRole('supervisor', member.id);
    }

    return this.members;
  }

  /**
   * 获取团队配置
   */
  private getTeamConfig(
    scale: ProjectScale,
    customConfig?: Partial<{
      architectCount: number;
      backendDevCount: number;
      frontendDevCount: number;
      testerCount: number;
      enableSupervisor: boolean;
    }>
  ): {
    architectCount: number;
    backendDevCount: number;
    frontendDevCount: number;
    testerCount: number;
    enableSupervisor: boolean;
  } {
    const defaults = {
      small: {
        architectCount: 1,
        backendDevCount: 1,
        frontendDevCount: 0,
        testerCount: 1,
        enableSupervisor: false
      },
      medium: {
        architectCount: 1,
        backendDevCount: 1,
        frontendDevCount: 1,
        testerCount: 1,
        enableSupervisor: true
      },
      large: {
        architectCount: 1,
        backendDevCount: 2,
        frontendDevCount: 2,
        testerCount: 2,
        enableSupervisor: true
      }
    };

    const baseConfig = defaults[scale];
    return {
      architectCount: customConfig?.architectCount ?? baseConfig.architectCount,
      backendDevCount: customConfig?.backendDevCount ?? baseConfig.backendDevCount,
      frontendDevCount: customConfig?.frontendDevCount ?? baseConfig.frontendDevCount,
      testerCount: customConfig?.testerCount ?? baseConfig.testerCount,
      enableSupervisor: customConfig?.enableSupervisor ?? baseConfig.enableSupervisor
    };
  }

  /**
   * 创建单个成员
   */
  private createMember(role: AgentRole, index: number): AgentTeamMember {
    const id = `${role}-${index + 1}`;
    const name = this.getRoleName(role, index);

    return {
      id,
      name,
      role,
      responsibilities: DEFAULT_RESPONSIBILITIES[role],
      skills: DEFAULT_SKILLS[role],
      status: 'idle',
      currentTask: undefined
    };
  }

  /**
   * 获取角色名称
   */
  private getRoleName(role: AgentRole, index: number): string {
    const roleNames: Record<AgentRole, string> = {
      architect: '架构师',
      backend_dev: '后端开发',
      frontend_dev: '前端开发',
      tester: '测试工程师',
      supervisor: '监工'
    };

    const baseName = roleNames[role];
    return index === 0 ? baseName : `${baseName}-${index + 1}`;
  }

  /**
   * 添加到角色分配映射
   */
  private addToRole(role: AgentRole, agentId: string): void {
    const current = this.roleAssignments.get(role) || [];
    current.push(agentId);
    this.roleAssignments.set(role, current);
  }

  /**
   * 分配任务给Agent
   */
  assignTask(agentId: string, taskId: string): boolean {
    const member = this.getMember(agentId);
    if (!member) {
      return false;
    }

    // 更新成员状态
    member.status = 'working';
    member.currentTask = taskId;

    // 更新任务分配映射
    const currentTasks = this.taskAssignments.get(agentId) || [];
    currentTasks.push(taskId);
    this.taskAssignments.set(agentId, currentTasks);

    return true;
  }

  /**
   * 更新Agent状态
   */
  updateStatus(agentId: string, status: 'idle' | 'working' | 'blocked' | 'completed'): boolean {
    const member = this.getMember(agentId);
    if (!member) {
      return false;
    }

    member.status = status;

    // 如果完成或阻塞，清除当前任务
    if (status === 'completed' || status === 'blocked') {
      member.currentTask = undefined;
    }

    return true;
  }

  /**
   * 获取成员
   */
  getMember(agentId: string): AgentTeamMember | undefined {
    return this.members.find(m => m.id === agentId);
  }

  /**
   * 获取可用Agent（指定角色）
   */
  getAvailableAgents(role: AgentRole): AgentTeamMember[] {
    const agentIds = this.roleAssignments.get(role) || [];
    return agentIds
      .map(id => this.getMember(id))
      .filter(m => m !== undefined && m.status === 'idle') as AgentTeamMember[];
  }

  /**
   * 获取所有可用Agent
   */
  getAllAvailableAgents(): AgentTeamMember[] {
    return this.members.filter(m => m.status === 'idle');
  }

  /**
   * 获取指定角色的所有Agent
   */
  getAgentsByRole(role: AgentRole): AgentTeamMember[] {
    const agentIds = this.roleAssignments.get(role) || [];
    return agentIds
      .map(id => this.getMember(id))
      .filter(m => m !== undefined) as AgentTeamMember[];
  }

  /**
   * 为阶段分配Agent
   */
  assignAgentsForStage(stage: WorkflowStage): AgentTeamMember[] {
    const requiredRoles = getRequiredRoles(stage);
    const assigned: AgentTeamMember[] = [];

    for (const role of requiredRoles) {
      const available = this.getAvailableAgents(role);

      if (available.length > 0) {
        // 分配第一个可用Agent
        const agent = available[0];
        this.assignTask(agent.id, `task-${stage}`);
        assigned.push(agent);
      } else {
        // 检查是否有该角色的Agent（即使不是idle）
        const roleAgents = this.getAgentsByRole(role);
        if (roleAgents.length === 0) {
          // 需要创建新的Agent
          const newMember = this.createMember(role, this.members.filter(m => m.role === role).length);
          this.members.push(newMember);
          this.addToRole(role, newMember.id);
          this.assignTask(newMember.id, `task-${stage}`);
          assigned.push(newMember);
        }
      }
    }

    return assigned;
  }

  /**
   * 获取团队状态摘要
   */
  getTeamStatusSummary(): {
    total: number;
    idle: number;
    working: number;
    blocked: number;
    completed: number;
    byRole: Record<AgentRole, { total: number; idle: number; working: number }>;
  } {
    const summary = {
      total: this.members.length,
      idle: 0,
      working: 0,
      blocked: 0,
      completed: 0,
      byRole: {} as Record<AgentRole, { total: number; idle: number; working: number }>
    };

    // 初始化角色统计
    for (const role of ['architect', 'backend_dev', 'frontend_dev', 'tester', 'supervisor'] as AgentRole[]) {
      summary.byRole[role] = { total: 0, idle: 0, working: 0 };
    }

    for (const member of this.members) {
      switch (member.status) {
        case 'idle': summary.idle++; break;
        case 'working': summary.working++; break;
        case 'blocked': summary.blocked++; break;
        case 'completed': summary.completed++; break;
      }

      const roleStats = summary.byRole[member.role];
      roleStats.total++;
      if (member.status === 'idle') roleStats.idle++;
      if (member.status === 'working') roleStats.working++;
    }

    return summary;
  }

  /**
   * 格式化团队状态为Markdown
   */
  formatTeamMarkdown(): string {
    const summary = this.getTeamStatusSummary();
    const lines: string[] = [
      '# Agent Team Status',
      '',
      `**Total Members:** ${summary.total}`,
      `**Working:** ${summary.working}`,
      `**Idle:** ${summary.idle}`,
      `**Blocked:** ${summary.blocked}`,
      '',
      '## Team Members',
      ''
    ];

    for (const member of this.members) {
      const statusIcon = this.getStatusIcon(member.status);
      lines.push(`- ${statusIcon} **${member.name}** (${member.id})`);
      lines.push(`  - Role: ${member.role}`);
      lines.push(`  - Status: ${member.status}`);
      if (member.currentTask) {
        lines.push(`  - Current Task: ${member.currentTask}`);
      }
    }

    lines.push('');
    lines.push('## Role Distribution');
    lines.push('');

    for (const [role, stats] of Object.entries(summary.byRole)) {
      if (stats.total > 0) {
        lines.push(`- **${role}:** ${stats.total} total (${stats.idle} idle, ${stats.working} working)`);
      }
    }

    return lines.join('\n');
  }

  /**
   * 获取状态图标
   */
  private getStatusIcon(status: 'idle' | 'working' | 'blocked' | 'completed'): string {
    switch (status) {
      case 'idle': return '💤';
      case 'working': return '🔧';
      case 'blocked': return '🚫';
      case 'completed': return '✅';
      default: return '❓';
    }
  }
}

/**
 * 创建Agent Team管理器
 */
export function createAgentTeamManager(): AgentTeamManager {
  return new AgentTeamManager();
}

/**
 * 快速创建团队
 */
export function createTeam(
  scale: ProjectScale,
  requirements?: string[]
): AgentTeamMember[] {
  const manager = new AgentTeamManager();
  return manager.createTeam(scale);
}