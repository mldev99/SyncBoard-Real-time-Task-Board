import type { BoardState } from './types';

export const initialBoard: BoardState = {
  updatedAt: Date.now(),
  tasks: [
    { id: 'welcome', title: 'Welcome to SyncBoard', description: 'Drag tasks between columns to keep the whole team in sync.', column: 'backlog', priority: 'Medium', assignee: 'AM', tags: ['Getting started'], updatedAt: Date.now() },
    { id: 'research', title: 'Research competitor workflows', description: 'Capture the top patterns and opportunities for our next release.', column: 'backlog', priority: 'Low', assignee: 'JD', tags: ['Research'], updatedAt: Date.now() },
    { id: 'dashboard', title: 'Build analytics dashboard', description: 'Turn weekly product metrics into a clear, shareable view.', column: 'progress', priority: 'High', assignee: 'SK', tags: ['Product', 'Q3 goals'], updatedAt: Date.now() },
    { id: 'onboarding', title: 'Polish onboarding checklist', description: 'Make the first-run experience feel effortless for new teams.', column: 'progress', priority: 'Medium', assignee: 'AM', tags: ['Design'], updatedAt: Date.now() },
    { id: 'api', title: 'Review API documentation', description: 'Check examples and update the authentication section.', column: 'review', priority: 'Medium', assignee: 'JD', tags: ['Docs'], updatedAt: Date.now() },
    { id: 'launch', title: 'Plan launch retro', description: 'Schedule a 45-minute retrospective with the launch team.', column: 'done', priority: 'Low', assignee: 'SK', tags: ['Team'], updatedAt: Date.now() },
  ],
};
