export type ColumnId = 'backlog' | 'progress' | 'review' | 'done';

export type Task = {
  id: string;
  title: string;
  description: string;
  column: ColumnId;
  priority: 'Low' | 'Medium' | 'High';
  assignee: string;
  dueDate?: string;
  tags: string[];
  updatedAt: number;
};

export type BoardState = {
  tasks: Task[];
  updatedAt: number;
};

export type SyncStatus = 'connected' | 'offline' | 'syncing';
