import { describe, it, expect, beforeEach } from 'vitest';
import {
  AgentTeamManager,
  createAgentTeamManager,
  createTeam
} from '../../../src/core/workflow-engine/agent-team.js';
import { ProjectScale, AgentRole } from '../../../src/core/workflow-engine/types.js';

describe('Agent Team Manager', () => {
  let manager: AgentTeamManager;

  beforeEach(() => {
    manager = createAgentTeamManager();
  });

  describe('createTeam', () => {
    it('should create team for small project', () => {
      const team = manager.createTeam('small');

      expect(team.length).toBeGreaterThan(0);
      expect(team.some(m => m.role === 'architect')).toBe(true);
      expect(team.some(m => m.role === 'backend_dev')).toBe(true);
    });

    it('should create larger team for large project', () => {
      const smallTeam = manager.createTeam('small');
      manager = createAgentTeamManager();
      const largeTeam = manager.createTeam('large');

      expect(largeTeam.length).toBeGreaterThan(smallTeam.length);
    });

    it('should include supervisor for medium and large projects', () => {
      manager.createTeam('medium');
      expect(manager.getAgentsByRole('supervisor').length).toBe(1);

      manager = createAgentTeamManager();
      manager.createTeam('large');
      expect(manager.getAgentsByRole('supervisor').length).toBe(1);
    });

    it('should not include supervisor for small projects by default', () => {
      manager.createTeam('small');
      expect(manager.getAgentsByRole('supervisor').length).toBe(0);
    });

    it('should have correct default skills for each role', () => {
      const team = manager.createTeam('medium');

      const architect = team.find(m => m.role === 'architect');
      expect(architect?.skills).toContain('system-design');

      const backend = team.find(m => m.role === 'backend_dev');
      expect(backend?.skills).toContain('coding');
    });

    it('should have correct responsibilities for each role', () => {
      const team = manager.createTeam('medium');

      const tester = team.find(m => m.role === 'tester');
      expect(tester?.responsibilities).toContain('Design test cases');
    });
  });

  describe('assignTask', () => {
    it('should assign task to agent', () => {
      manager.createTeam('medium');
      const agent = manager.getAvailableAgents('architect')[0];

      const result = manager.assignTask(agent.id, 'task-123');
      expect(result).toBe(true);
      expect(agent.status).toBe('working');
      expect(agent.currentTask).toBe('task-123');
    });

    it('should return false for invalid agent', () => {
      manager.createTeam('medium');
      const result = manager.assignTask('invalid-agent', 'task-123');
      expect(result).toBe(false);
    });
  });

  describe('updateStatus', () => {
    it('should update agent status', () => {
      manager.createTeam('medium');
      const agent = manager.getAvailableAgents('backend_dev')[0];

      manager.updateStatus(agent.id, 'working');
      expect(agent.status).toBe('working');

      manager.updateStatus(agent.id, 'completed');
      expect(agent.status).toBe('completed');
      expect(agent.currentTask).toBeUndefined();
    });
  });

  describe('getAvailableAgents', () => {
    it('should return idle agents', () => {
      manager.createTeam('medium');
      const available = manager.getAvailableAgents('backend_dev');
      expect(available.length).toBeGreaterThan(0);
      expect(available.every(a => a.status === 'idle')).toBe(true);
    });

    it('should return empty when all are working', () => {
      manager.createTeam('small');
      const devs = manager.getAgentsByRole('backend_dev');

      for (const dev of devs) {
        manager.updateStatus(dev.id, 'working');
      }

      const available = manager.getAvailableAgents('backend_dev');
      expect(available.length).toBe(0);
    });
  });

  describe('getAgentsByRole', () => {
    it('should return all agents of specified role', () => {
      manager.createTeam('large');
      const backends = manager.getAgentsByRole('backend_dev');
      expect(backends.length).toBe(2);

      const frontends = manager.getAgentsByRole('frontend_dev');
      expect(frontends.length).toBe(2);
    });
  });

  describe('assignAgentsForStage', () => {
    it('should assign architect for requirements design', () => {
      manager.createTeam('medium');
      const assigned = manager.assignAgentsForStage('W01_requirements_design');

      expect(assigned.some(a => a.role === 'architect')).toBe(true);
    });

    it('should assign developers for development stage', () => {
      manager.createTeam('medium');
      const assigned = manager.assignAgentsForStage('W08_development');

      expect(assigned.some(a => a.role === 'backend_dev')).toBe(true);
    });

    it('should create new agent if needed', () => {
      manager.createTeam('small');
      // Small team doesn't have frontend_dev by default

      const assigned = manager.assignAgentsForStage('W05_detail_design');
      // This stage requires frontend_dev

      expect(manager.getAgentsByRole('frontend_dev').length).toBeGreaterThan(0);
    });
  });

  describe('getTeamStatusSummary', () => {
    it('should return correct summary', () => {
      manager.createTeam('medium');
      const summary = manager.getTeamStatusSummary();

      expect(summary.total).toBeGreaterThan(0);
      expect(summary.idle).toBeGreaterThan(0);
      expect(summary.working).toBe(0);
    });

    it('should count working agents correctly', () => {
      manager.createTeam('medium');
      const agents = manager.getAllAvailableAgents();

      manager.assignTask(agents[0].id, 'task-1');
      manager.assignTask(agents[1].id, 'task-2');

      const summary = manager.getTeamStatusSummary();
      expect(summary.working).toBe(2);
      expect(summary.idle).toBe(summary.total - 2);
    });
  });

  describe('formatTeamMarkdown', () => {
    it('should format team correctly', () => {
      manager.createTeam('medium');
      const md = manager.formatTeamMarkdown();

      expect(md).toContain('Agent Team Status');
      expect(md).toContain('Total Members');
      expect(md).toContain('架构师');
    });
  });
});

describe('createTeam', () => {
  it('should create team quickly', () => {
    const team = createTeam('medium');
    expect(team.length).toBeGreaterThan(0);
  });
});