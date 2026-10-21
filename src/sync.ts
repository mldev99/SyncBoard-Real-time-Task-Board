import type { BoardState } from './types';
import { clearQueue, queueBoard, readQueuedBoards } from './storage';

const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('syncboard-updates') : null;

export function createSync(onRemoteBoard: (board: BoardState) => void, onStatus: (online: boolean) => void) {
  const endpoint = import.meta.env.VITE_WS_URL as string | undefined;
  let socket: WebSocket | undefined;
  let closed = false;

  const connect = () => {
    if (closed || !endpoint) {
      onStatus(navigator.onLine);
      return;
    }
    socket = new WebSocket(endpoint);
    socket.onopen = async () => {
      onStatus(true);
      const queued = await readQueuedBoards();
      queued.forEach((board) => socket?.send(JSON.stringify(board)));
      if (queued.length) await clearQueue();
    };
    socket.onmessage = (event) => {
      try {
        const board = JSON.parse(event.data) as BoardState;
        if (board.tasks && board.updatedAt) onRemoteBoard(board);
      } catch {
        console.warn('SyncBoard received an invalid update.');
      }
    };
    socket.onclose = () => {
      if (!closed) onStatus(false);
    };
  };

  const publish = async (board: BoardState) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(board));
    } else {
      await queueBoard(board);
    }
    channel?.postMessage(board);
  };
  const receiveChannel = (event: MessageEvent<BoardState>) => onRemoteBoard(event.data);
  const online = () => { onStatus(true); connect(); };
  const offline = () => onStatus(false);
  channel?.addEventListener('message', receiveChannel);
  window.addEventListener('online', online);
  window.addEventListener('offline', offline);
  connect();

  return {
    publish,
    dispose: () => {
      closed = true;
      socket?.close();
      channel?.removeEventListener('message', receiveChannel);
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    },
  };
}
