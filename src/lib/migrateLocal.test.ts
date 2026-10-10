import { describe, it, expect } from 'vitest';
import { normalizeLocalData } from './migrateLocal';

describe('normalizeLocalData', () => {
  it('fills new Project fields from old localStorage shape', () => {
    const out = normalizeLocalData({
      projects: [{ id: 'p1', name: 'Viejo', description: 'd', color: '#000', createdAt: 't' }],
    });
    expect(out.projects[0]).toMatchObject({
      id: 'p1', client: '', status: 'active', startDate: '', dueDate: '', notes: '', links: [],
    });
  });

  it('keeps tasks and defaults missing arrays', () => {
    const out = normalizeLocalData({ tasks: [{ id: 't1', projectId: 'p1', title: 'X', status: 'todo', priority: 'high' }] });
    expect(out.tasks[0].tags).toEqual([]);
    expect(out.tasks[0].subtasks).toEqual([]);
  });

  it('returns null settings when absent', () => {
    expect(normalizeLocalData({}).settings).toBeNull();
  });
});
