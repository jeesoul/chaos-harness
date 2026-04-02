import { EffectivenessRecord } from './types.js';
import fs from 'fs/promises';

export class EffectivenessTracker {
  private records: EffectivenessRecord[] = [];
  private logPath: string | null = null;

  constructor(logPath?: string) {
    this.logPath = logPath || null;
  }

  record(entry: Omit<EffectivenessRecord, 'timestamp'>): void {
    const record: EffectivenessRecord = {
      ...entry,
      timestamp: new Date().toISOString()
    };
    this.records.push(record);

    if (this.logPath) {
      this.persistRecord(record);
    }
  }

  private async persistRecord(record: EffectivenessRecord): Promise<void> {
    if (!this.logPath) return;

    const line = JSON.stringify(record) + '\n';
    await fs.appendFile(this.logPath, line);
  }

  getRecords(): EffectivenessRecord[] {
    return [...this.records];
  }

  calculateScore(): number {
    if (this.records.length === 0) return 100;

    let totalScore = 0;

    for (const record of this.records) {
      let recordScore = 100;

      // 每个铁律违规扣10分
      recordScore -= record.ironLawViolations * 10;

      // 每个跳过的推荐扣5分
      recordScore -= record.recommendationsSkipped.length * 5;

      // 用户满意度影响
      if (record.userSatisfaction !== null) {
        recordScore = recordScore * 0.5 + record.userSatisfaction * 0.5;
      }

      totalScore += Math.max(0, recordScore);
    }

    return totalScore / this.records.length;
  }

  shouldSuggestUpgrade(): boolean {
    if (this.records.length < 3) return false;

    const recentRecords = this.records.slice(-3);
    const avgViolations = recentRecords.reduce((sum, r) => sum + r.ironLawViolations, 0) / 3;

    return avgViolations > 0.5 || this.calculateScore() < 70;
  }

  getSummary(): { totalTasks: number; avgScore: number; totalViolations: number } {
    return {
      totalTasks: this.records.length,
      avgScore: this.calculateScore(),
      totalViolations: this.records.reduce((sum, r) => sum + r.ironLawViolations, 0)
    };
  }
}

export function formatEffectivenessMarkdown(records: EffectivenessRecord[]): string {
  const lines: string[] = [
    '# Harness Effectiveness Log',
    '',
    '## Summary',
    '',
    `| Total Tasks | Average Score | Total Violations |`,
    `|-------------|---------------|------------------|`,
    `| ${records.length} | ${calculateAverageScore(records).toFixed(1)} | ${records.reduce((s, r) => s + r.ironLawViolations, 0)} |`,
    '',
    '## Records',
    ''
  ];

  for (const record of records) {
    lines.push(`### ${record.taskId} (${record.timestamp.split('T')[0]})`);
    lines.push(`- Iron Law Violations: ${record.ironLawViolations}`);
    lines.push(`- Recommendations Skipped: ${record.recommendationsSkipped.length}`);
    if (record.userSatisfaction !== null) {
      lines.push(`- User Satisfaction: ${record.userSatisfaction}/100`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function calculateAverageScore(records: EffectivenessRecord[]): number {
  if (records.length === 0) return 100;

  let total = 0;
  for (const r of records) {
    let score = 100 - r.ironLawViolations * 10 - r.recommendationsSkipped.length * 5;
    if (r.userSatisfaction !== null) {
      score = score * 0.5 + r.userSatisfaction * 0.5;
    }
    total += Math.max(0, score);
  }
  return total / records.length;
}