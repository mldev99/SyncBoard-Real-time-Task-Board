# SyncBoard

An offline-first, real-time task board built with React and TypeScript.

## Features

- Four-column task board with drag-and-drop, filtering, search, task creation, and task details.
- WebSocket synchronization through `VITE_WS_URL`; BroadcastChannel keeps multiple local tabs in sync when no server is configured.
- IndexedDB persistence and an outbound queue for edits made while offline.
- Service worker app-shell caching for fast repeat visits.

## Getting started

```bash
npm install
npm run dev
```

To connect a WebSocket server, set `VITE_WS_URL` in a `.env` file. The server should broadcast JSON `BoardState` payloads to connected clients.

```bash
npm run build
```
