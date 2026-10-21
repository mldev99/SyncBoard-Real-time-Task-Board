import { openDB, type DBSchema } from 'idb';
import type { BoardState } from './types';

interface SyncBoardDB extends DBSchema {
  state: { key: string; value: BoardState };
  queue: { key: string; value: BoardState };
}

const database = openDB<SyncBoardDB>('syncboard', 1, {
  upgrade(db) {
    db.createObjectStore('state');
    db.createObjectStore('queue');
  },
});

export async function readBoard(): Promise<BoardState | undefined> {
  return (await database).get('state', 'board');
}

export async function saveBoard(board: BoardState): Promise<void> {
  await (await database).put('state', board, 'board');
}

export async function queueBoard(board: BoardState): Promise<void> {
  await (await database).put('queue', board, String(board.updatedAt));
}

export async function readQueuedBoards(): Promise<BoardState[]> {
  return (await database).getAll('queue');
}

export async function clearQueue(): Promise<void> {
  await (await database).clear('queue');
}
