import { describe, it, expect } from 'vitest';
import { EffectivenessTracker, formatEffectivenessMarkdown } from '../../../src/core/harness-generator/effectiveness.js';
import { EffectivenessRecord } from '../../../src/core/harness-generator/types.js';

describe('EffectivenessTracker', () => {
  it('should record effectiveness entry', () => {
    const tracker = new EffectivenessTracker();
    tracker.record({
      taskId: 'task-001',
      ironLawViolations: 0,
      recommendationsSkipped: [],
      userSatisfaction: 95
    });
    expect(tracker.getRecords().length).toBe(1);
  });

  it('should calculate effectiveness score', () => {
    const tracker = new EffectivenessTracker();
    tracker.record({ taskId: 't1', ironLawViolations: 0, recommendationsSkipped: [], userSatisfaction: 90 });
    tracker.record({ taskId: 't2', ironLawViolations: 1, recommendationsSkipped: [], userSatisfaction: 80 });
    const score = tracker.calculateScore();
    // t1: (100 * 0.5 + 90 * 0.5) = 95
    // t2: (90 * 0.5 + 80 * 0.5) = 85
    // average: (95 + 85) / 2 = 90
    expect(score).toBe(90);
  });

  it('should suggest upgrade when score low', () => {
    const tracker = new EffectivenessTracker();
    for (let i = 0; i < 3; i++) {
      tracker.record({ taskId: `t${i}`, ironLawViolations: 2, recommendationsSkipped: ['R001'], userSatisfaction: 60 });
    }
    expect(tracker.shouldSuggestUpgrade()).toBe(true);
  });

  it('should return empty records initially', () => {
    const tracker = new EffectivenessTracker();
    expect(tracker.getRecords()).toEqual([]);
  });

  it('should calculate score as 100 for empty records', () => {
    const tracker = new EffectivenessTracker();
    expect(tracker.calculateScore()).toBe(100);
  });

  it('should not suggest upgrade with fewer than 3 records', () => {
    const tracker = new EffectivenessTracker();
    tracker.record({ taskId: 't1', ironLawViolations: 5, recommendationsSkipped: [], userSatisfaction: 30 });
    expect(tracker.shouldSuggestUpgrade()).toBe(false);
  });

  it('should not suggest upgrade when performance is good', () => {
    const tracker = new EffectivenessTracker();
    for (let i = 0; i < 3; i++) {
      tracker.record({ taskId: `t${i}`, ironLawViolations: 0, recommendationsSkipped: [], userSatisfaction: 95 });
    }
    expect(tracker.shouldSuggestUpgrade()).toBe(false);
  });

  it('should include timestamp in records', () => {
    const tracker = new EffectivenessTracker();
    tracker.record({ taskId: 'task-001', ironLawViolations: 0, recommendationsSkipped: [], userSatisfaction: 95 });
    const records = tracker.getRecords();
    expect(records[0].timestamp).toBeDefined();
    expect(new Date(records[0].timestamp).toISOString()).toBe(records[0].timestamp);
  });

  it('should calculate summary correctly', () => {
    const tracker = new EffectivenessTracker();
    tracker.record({ taskId: 't1', ironLawViolations: 1, recommendationsSkipped: [], userSatisfaction: 90 });
    tracker.record({ taskId: 't2', ironLawViolations: 2, recommendationsSkipped: ['R001'], userSatisfaction: 80 });
    const summary = tracker.getSummary();
    expect(summary.totalTasks).toBe(2);
    expect(summary.totalViolations).toBe(3);
    expect(summary.avgScore).toBeGreaterThan(0);
    expect(summary.avgScore).toBeLessThan(100);
  });

  it('should handle null user satisfaction', () => {
    const tracker = new EffectivenessTracker();
    tracker.record({ taskId: 't1', ironLawViolations: 0, recommendationsSkipped: [], userSatisfaction: null });
    const score = tracker.calculateScore();
    expect(score).toBe(100);
  });
});

describe('formatEffectivenessMarkdown', () => {
  it('should format empty records', () => {
    const markdown = formatEffectivenessMarkdown([]);
    expect(markdown).toContain('# Harness Effectiveness Log');
    expect(markdown).toContain('Total Tasks');
    expect(markdown).toContain('0');
  });

  it('should format records with satisfaction', () => {
    const records: EffectivenessRecord[] = [
      {
        timestamp: '2024-01-15T10:30:00.000Z',
        taskId: 'task-001',
        ironLawViolations: 0,
        recommendationsSkipped: [],
        userSatisfaction: 95,
        notes: ''
      }
    ];
    const markdown = formatEffectivenessMarkdown(records);
    expect(markdown).toContain('task-001');
    expect(markdown).toContain('User Satisfaction: 95/100');
    expect(markdown).toContain('2024-01-15');
  });

  it('should format records with violations', () => {
    const records: EffectivenessRecord[] = [
      {
        timestamp: '2024-01-15T10:30:00.000Z',
        taskId: 'task-002',
        ironLawViolations: 2,
        recommendationsSkipped: ['R001', 'R002'],
        userSatisfaction: 70,
        notes: ''
      }
    ];
    const markdown = formatEffectivenessMarkdown(records);
    expect(markdown).toContain('Iron Law Violations: 2');
    expect(markdown).toContain('Recommendations Skipped: 2');
  });
});