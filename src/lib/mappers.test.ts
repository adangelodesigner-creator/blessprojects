import { describe, it, expect } from 'vitest';
import { projectToRow, rowToProject, taskToRow, rowToTask } from './mappers';
import type { Project, Task } from '../types';

const project: Project = {
  id: 'p1', name: 'P', description: 'd', color: '#FF6B00',
  client: 'FloxAI', status: 'active', startDate: '', dueDate: '2026-01-02',
  notes: 'n', links: [{ id: 'l1', label: 'Drive', url: 'https://x' }],
  objectives: [{ id: 'o1', text: 'Meta 1', done: false }],
  sharedWith: [],
  userId: 'u1',
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('project mappers', () => {
  it('converts empty dates to null for the DB', () => {
    const row = projectToRow(project, 'u1');
    expect(row.start_date).toBeNull();
    expect(row.due_date).toBe('2026-01-02');
    expect(row.user_id).toBe('u1');
  });

  it('round-trips through the DB shape', () => {
    const back = rowToProject(projectToRow(project, 'u1'));
    expect(back).toEqual(project);
  });

  it('defaults missing optional fields when reading a row', () => {
    const p = rowToProject({ id: 'p2', name: 'X', color: '#000', status: 'paused', created_at: 't' });
    expect(p.client).toBe('');
    expect(p.links).toEqual([]);
    expect(p.startDate).toBe('');
  });
});

const task: Task = {
  id: 't1', projectId: 'p1', title: 'T', description: '', status: 'todo',
  priority: 'high', dueDate: '', tags: ['a'], subtasks: [], createdAt: '2026-01-01T00:00:00.000Z',
};

describe('task mappers', () => {
  it('round-trips and nulls empty dueDate', () => {
    const row = taskToRow(task, 'u1');
    expect(row.due_date).toBeNull();
    expect(rowToTask(row)).toEqual(task);
  });
});
