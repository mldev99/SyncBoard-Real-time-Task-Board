# SyncBoard — Move work forward

> A collaborative, offline-first task board for teams that need their work to stay available and synchronized wherever they are.

[![Live Demo](https://img.shields.io/badge/Live%20demo-syncboard--real--time--task--board.vercel.app-6254D9?style=flat-square)](https://sync-board-real-time-task-board.vercel.app/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=20232A)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev/)

## Live application

**[Open SyncBoard](https://sync-board-real-time-task-board.vercel.app/)**

The deployed application presents a product-team workspace with a shared board, task columns, priority indicators, collaborators, search, filtering, task creation, and an offline-aware synchronization status.

## Project overview

SyncBoard is a Kanban-style task management application designed around three principles:

1. **Make work visible** — tasks are organized into Backlog, In progress, In review, and Done.
2. **Keep collaboration immediate** — task changes can be published through WebSockets and mirrored between open browser tabs.
3. **Keep the product useful without a network** — the latest board is stored locally in IndexedDB, and edits made offline are queued for delivery when connectivity returns.

The project was built as a React and TypeScript single-page application and is deployable as a static Vite build. A service worker caches the application shell so the board can open quickly on repeat visits.

## Main features

### Board workflow

- Four focused workflow columns:
  - **Backlog** — ideas and incoming requests
  - **In progress** — active work
  - **In review** — work ready for feedback
  - **Done** — shipped work
- Drag tasks between columns.
- Move a task using its column selector for keyboard-friendly operation.
- Create tasks from the main **Add task** action or from a column.
- Open a task to view its details.
- Delete tasks from the task actions menu.

### Find and prioritize work

- Search task titles, descriptions, and tags.
- Filter by Low, Medium, or High priority.
- Display task tags, assignees, due dates, and overdue state.
- Show per-column task counts.

### Real-time collaboration

- Optional WebSocket transport configured through `VITE_WS_URL`.
- Incoming board snapshots are accepted only when they are newer than the current local board.
- BroadcastChannel synchronizes changes between tabs on the same origin.
- Connection state is surfaced in the interface as:
  - **All changes synced**
  - **Saving changes...**
  - **Offline mode**

### Offline-first behavior

- The current board is persisted in IndexedDB.
- Edits made when a WebSocket is unavailable are saved to an outbound queue.
- Queued board snapshots are sent when a WebSocket connection opens again.
- The browser `online` and `offline` events update the user-facing sync state.
- The app can still be opened from the cached application shell after the network is unavailable.

### Installable app foundation

- A service worker caches the app shell and static assets.
- Repeat visits can load the interface from cache before network resources are available.
- The service worker uses a cache-first strategy for already cached resources and a network fallback for new resources.

## Technology stack

| Area | Technology | Purpose |
| --- | --- | --- |
| UI | React 18 | Component-based application interface |
| Language | TypeScript 5 | Typed task, board, sync, and storage models |
| Build tool | Vite 6 | Fast development server and production bundling |
| Persistence | IndexedDB via `idb` | Local board state and offline outbound queue |
| Collaboration | WebSocket API | Optional server-backed board synchronization |
| Multi-tab sync | BroadcastChannel API | Local browser-tab updates without a server |
| Offline shell | Service Worker | App-shell caching and repeat-load performance |
| Hosting | Vercel | Static production deployment |
| Testing commands | Jest and Playwright | Unit/component and end-to-end test entry points |

## Architecture

```text
                    ┌──────────────────────┐
                    │       React UI        │
                    │ board, cards, modal   │
                    └──────────┬───────────┘
                               │ updateBoard()
                ┌──────────────┴──────────────┐
                │                             │
       ┌────────▼────────┐          ┌─────────▼─────────┐
       │ IndexedDB store │          │ Sync coordinator  │
       │ current + queue │          │ WebSocket + tabs  │
       └─────────────────┘          └─────────┬─────────┘
                                             │
                                  ┌──────────▼──────────┐
                                  │ Optional WS server  │
                                  │ broadcast snapshots │
                                  └─────────────────────┘

       Service worker: caches the static application shell
```

### Board state model

The board is represented as a timestamped snapshot:

```ts
type BoardState = {
  tasks: Task[];
  updatedAt: number;
};
```

Each task contains:

```ts
type Task = {
  id: string;
  title: string;
  description: string;
  column: 'backlog' | 'progress' | 'review' | 'done';
  priority: 'Low' | 'Medium' | 'High';
  assignee: string;
  dueDate?: string;
  tags: string[];
  updatedAt: number;
};
```

### Synchronization flow

1. The app loads the most recent board from IndexedDB.
2. `createSync()` initializes the configured WebSocket connection and browser event listeners.
3. A local change updates React state and is persisted to IndexedDB.
4. If the socket is open, the board snapshot is sent immediately.
5. If the socket is unavailable, the snapshot is written to the IndexedDB queue.
6. The update is also posted to the `syncboard-updates` BroadcastChannel for other open tabs.
7. When the socket reconnects, queued snapshots are sent and the queue is cleared.
8. Incoming snapshots replace local state only if their timestamp is newer.

## Getting started

### Requirements

- Node.js 18 or newer
- npm 9 or newer

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

Open the local URL printed by Vite, normally:

```text
http://localhost:5173
```

### Create a production build

```bash
npm run build
```

### Preview the production build

```bash
npm run preview
```

## WebSocket configuration

The frontend works without a WebSocket URL by using IndexedDB and BroadcastChannel. To connect it to a real synchronization server, create a local `.env` file:

```env
VITE_WS_URL=wss://your-websocket-server.example.com
```

The server should accept JSON board snapshots and broadcast them to the other connected clients. A payload has the following shape:

```json
{
  "updatedAt": 1735689600000,
  "tasks": [
    {
      "id": "task-1",
      "title": "Example task",
      "description": "A task shared with the team.",
      "column": "progress",
      "priority": "High",
      "assignee": "JD",
      "tags": ["Product"],
      "updatedAt": 1735689600000
    }
  ]
}
```

For production use, the server should add authentication, authorization, durable storage, conflict resolution, reconnect backoff, and validation for incoming payloads. The current client intentionally keeps the transport contract small and framework-independent.

## Project structure

```text
.
├── public/
│   ├── favicon.svg       # Application icon
│   └── sw.js             # Service worker and cache strategy
├── src/
│   ├── App.tsx           # Board layout, interactions, task modal, and UI components
│   ├── data.ts           # Seed board data for the first visit
│   ├── main.tsx          # React entry point and service-worker registration
│   ├── storage.ts        # IndexedDB database, board persistence, and queue
│   ├── sync.ts           # WebSocket, BroadcastChannel, and online-state handling
│   ├── styles.css        # Product UI styling and responsive layout rules
│   ├── types.ts          # Shared board and task types
│   └── vite-env.d.ts     # Vite type declarations
├── index.html
├── package.json
├── tsconfig*.json
└── vite.config.ts
```

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and build the production bundle |
| `npm run preview` | Serve the production bundle locally |
| `npm test` | Run Jest in-band |
| `npm run test:e2e` | Run Playwright end-to-end tests |

The Jest and Playwright commands are included as the project’s test entry points. Add test files and the corresponding Jest/Playwright configuration as the test suite grows.

## Performance and accessibility goals

SyncBoard is designed for a fast, low-friction workspace experience:

- Vite produces a compact production bundle.
- The service worker caches the application shell for repeat visits.
- Board reads and writes are local-first and do not block on a round trip.
- Semantic buttons, labels, form controls, and visible status messaging support keyboard and assistive-technology use.
- The interface uses high-contrast status and priority indicators rather than relying only on color.

The project target is **90+ Lighthouse Performance** and **95+ Lighthouse Accessibility**. Lighthouse should be run against the production preview or deployed URL when validating a release, because development-server scores do not represent the optimized bundle.

## Deployment

The app is a static Vite build and can be deployed to Vercel, Netlify, GitHub Pages, or any static hosting provider:

```bash
npm run build
```

Publish the generated `dist/` directory. For Vercel, connect the repository and use:

- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Environment variable:** `VITE_WS_URL` when a WebSocket backend is available

The live SyncBoard deployment is available at:

<https://sync-board-real-time-task-board.vercel.app/>

## Product timeline

**August 2025 – December 2025**

The project focus was building a collaborative task board with real-time updates, offline continuity, service-worker caching, and a quality baseline for component and end-to-end testing.

## Future improvements

- Add a dedicated backend with persistent board storage.
- Replace whole-board snapshots with versioned task-level operations.
- Add optimistic conflict resolution for simultaneous edits.
- Add authenticated workspaces and role-based permissions.
- Add real due-date editing, comments, and activity history.
- Add automated Jest component coverage and Playwright workflows.
- Add CI checks for type checking, tests, build output, and Lighthouse budgets.

## License

This project is a portfolio/demo application. Add a project-specific license before redistributing it publicly.
