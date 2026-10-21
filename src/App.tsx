import { useEffect, useMemo, useRef, useState } from 'react';
import { initialBoard } from './data';
import { readBoard, saveBoard } from './storage';
import { createSync } from './sync';
import type { BoardState, ColumnId, SyncStatus, Task } from './types';

const columns: { id: ColumnId; label: string; hint: string; color: string }[] = [
  { id: 'backlog', label: 'Backlog', hint: 'Ideas & requests', color: '#8b7ee8' },
  { id: 'progress', label: 'In progress', hint: 'Being worked on', color: '#f0a35b' },
  { id: 'review', label: 'In review', hint: 'Ready for feedback', color: '#5f9ee8' },
  { id: 'done', label: 'Done', hint: 'Shipped & celebrated', color: '#53bd8b' },
];

const avatarColors = ['#f2b4c7', '#c4b9f6', '#9bd5cd', '#f4cc9b'];

function Icon({ name }: { name: 'search' | 'bell' | 'grid' | 'list' | 'plus' | 'more' | 'calendar' | 'bolt' | 'close' }) {
  const paths: Record<string, string> = {
    search: 'm21 21l-4.35-4.35m2.35-5.65a8 8 0 11-16 0 8 8 0 0116 0z',
    bell: 'M18 8a6 6 0 00-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',
    grid: 'M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm10 0h6v6h-6z',
    list: 'M5 6h14M5 12h14M5 18h14',
    plus: 'M12 5v14M5 12h14',
    more: 'M5 12h.01M12 12h.01M19 12h.01',
    calendar: 'M6 3v3m12-3v3M4 9h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z',
    bolt: 'M13 2L4 14h7l-1 8 9-12h-7l1-8z',
    close: 'M6 6l12 12M18 6L6 18',
  };
  return <svg viewBox="0 0 24 24" className="icon" aria-hidden="true"><path d={paths[name]} /></svg>;
}

function Avatar({ initials, index = 0 }: { initials: string; index?: number }) {
  return <span className="avatar" style={{ background: avatarColors[index % avatarColors.length] }}>{initials}</span>;
}

function TaskCard({ task, onMove, onDelete, onOpen }: { task: Task; onMove: (id: string, column: ColumnId) => void; onDelete: (id: string) => void; onOpen: (task: Task) => void }) {
  const [menu, setMenu] = useState(false);
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
  return <article className="task-card" draggable onDragStart={(event) => event.dataTransfer.setData('task-id', task.id)} onClick={() => onOpen(task)}>
    <div className="card-top">
      <span className={`priority ${task.priority.toLowerCase()}`}><i />{task.priority}</span>
      <button className="icon-button" aria-label="Task menu" onClick={(event) => { event.stopPropagation(); setMenu(!menu); }}><Icon name="more" /></button>
      {menu && <div className="task-menu"><button onClick={() => onDelete(task.id)}>Delete task</button></div>}
    </div>
    <h3>{task.title}</h3>
    <p>{task.description}</p>
    <div className="tags">{task.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
    <div className="card-footer">
      <Avatar initials={task.assignee} />
      {task.dueDate && <span className={isOverdue ? 'due overdue' : 'due'}><Icon name="calendar" />{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
      <select aria-label={`Move ${task.title}`} value={task.column} onClick={(event) => event.stopPropagation()} onChange={(event) => onMove(task.id, event.target.value as ColumnId)}>
        {columns.map((column) => <option key={column.id} value={column.id}>{column.label}</option>)}
      </select>
    </div>
  </article>;
}

function App() {
  const [board, setBoard] = useState<BoardState>(initialBoard);
  const [status, setStatus] = useState<SyncStatus>(navigator.onLine ? 'connected' : 'offline');
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Task | undefined>();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | Task['priority']>('all');
  const syncRef = useRef<ReturnType<typeof createSync> | null>(null);

  useEffect(() => {
    readBoard().then((saved) => saved && setBoard(saved));
    const sync = createSync((remote) => {
      setBoard((current) => remote.updatedAt > current.updatedAt ? remote : current);
      setStatus('connected');
    }, (online) => setStatus(online ? 'connected' : 'offline'));
    syncRef.current = sync;
    return sync.dispose;
  }, []);

  const updateBoard = (updater: (current: BoardState) => BoardState) => {
    const next = updater(board);
    setBoard(next);
    setStatus('syncing');
    saveBoard(next).then(() => {
      syncRef.current?.publish(next);
      setStatus(navigator.onLine ? 'connected' : 'offline');
    });
  };

  const visibleTasks = useMemo(() => board.tasks.filter((task) => (filter === 'all' || task.priority === filter) && `${task.title} ${task.description} ${task.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase())), [board.tasks, filter, query]);
  const createTask = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const task: Task = { id: crypto.randomUUID(), title: String(form.get('title')), description: String(form.get('description') || 'No description yet.'), column: 'backlog', priority: String(form.get('priority')) as Task['priority'], assignee: 'AM', tags: ['New'], updatedAt: Date.now() };
    updateBoard((current) => ({ tasks: [task, ...current.tasks], updatedAt: task.updatedAt }));
    setShowModal(false);
  };
  const moveTask = (id: string, column: ColumnId) => updateBoard((current) => ({ ...current, updatedAt: Date.now(), tasks: current.tasks.map((task) => task.id === id ? { ...task, column, updatedAt: Date.now() } : task) }));

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">S</span><span>sync<span>board</span></span></div>
      <div className="workspace"><Avatar initials="AC" index={1} /><div><strong>Acme Corp</strong><small>Product team</small></div><span className="chevron">⌄</span></div>
      <nav><span className="nav-label">Workspace</span><a className="active"><Icon name="grid" />Board <b>24</b></a><a><Icon name="list" />My tasks <b>7</b></a><a><Icon name="calendar" />Calendar</a><span className="nav-label team-label">Manage</span><a><span className="dot purple" />Projects</a><a><span className="dot blue" />Design system</a><a><span className="dot green" />Growth experiments</a></nav>
      <div className="sidebar-bottom"><div className="upgrade"><div className="upgrade-icon"><Icon name="bolt" /></div><strong>Unlock your flow</strong><p>Get unlimited boards and integrations.</p><button>Upgrade plan <span>→</span></button></div><a><span className="help">?</span>Help & support</a><a><span className="gear">⚙</span>Settings</a><div className="user-row"><Avatar initials="JD" index={2} /><div><strong>Jordan Davis</strong><small>jordan@acme.co</small></div><Icon name="more" /></div></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="breadcrumbs"><span>Workspace</span><b>/</b><strong>Product board</strong></div><div className="top-actions"><div className="search"><Icon name="search" /><input placeholder="Search tasks..." value={query} onChange={(event) => setQuery(event.target.value)} /><kbd>⌘ K</kbd></div><button className="top-icon"><Icon name="bell" /><i /></button><button className="avatar-btn"><Avatar initials="JD" index={2} /></button></div></header>
      <section className="content">
        <div className="hero"><div><div className="eyebrow"><span className={`status-dot ${status}`} />{status === 'connected' ? 'All changes synced' : status === 'syncing' ? 'Saving changes...' : 'Offline mode'} <span className="live">• Live</span></div><h1>Product board</h1><p>Plan, prioritize, and ship better work together.</p></div><div className="hero-actions"><div className="collaborators"><Avatar initials="AM" index={0} /><Avatar initials="SK" index={3} /><Avatar initials="JD" index={2} /><span>+8</span></div><button className="button primary" onClick={() => setShowModal(true)}><Icon name="plus" />Add task</button></div></div>
        <div className="toolbar"><div className="view-tabs"><button className="selected"><Icon name="grid" />Board</button><button><Icon name="list" />List</button></div><div className="filters"><select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}><option value="all">All priorities</option><option value="High">High priority</option><option value="Medium">Medium priority</option><option value="Low">Low priority</option></select><button className="filter-button"><span className="filter-lines">≡</span> Filter</button></div></div>
        <div className="board">{columns.map((column) => <section className="column" key={column.id} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { const id = event.dataTransfer.getData('task-id'); if (id) moveTask(id, column.id); }}><div className="column-heading"><div><span className="column-title"><i style={{ background: column.color }} />{column.label}<em>{visibleTasks.filter((task) => task.column === column.id).length}</em></span><small>{column.hint}</small></div><button className="icon-button"><Icon name="more" /></button></div><div className="cards">{visibleTasks.filter((task) => task.column === column.id).map((task) => <TaskCard key={task.id} task={task} onMove={moveTask} onDelete={(id) => updateBoard((current) => ({ ...current, tasks: current.tasks.filter((item) => item.id !== id), updatedAt: Date.now() }))} onOpen={setSelected} />)}<button className="add-card" onClick={() => setShowModal(true)}><Icon name="plus" />Add task</button></div></section>)}</div>
      </section>
    </main>
    {(showModal || selected) && <div className="modal-backdrop" onClick={() => { setShowModal(false); setSelected(undefined); }}><div className="modal" onClick={(event) => event.stopPropagation()}>{selected ? <><button className="modal-close" onClick={() => setSelected(undefined)}><Icon name="close" /></button><span className={`priority ${selected.priority.toLowerCase()}`}><i />{selected.priority}</span><h2>{selected.title}</h2><p>{selected.description}</p><div className="modal-meta"><Avatar initials={selected.assignee} /><span>Assigned to {selected.assignee}</span></div></> : <form onSubmit={createTask}><button type="button" className="modal-close" onClick={() => setShowModal(false)}><Icon name="close" /></button><h2>Create a task</h2><p className="modal-subtitle">Add a new item to your team backlog.</p><label>Task name<input name="title" required placeholder="e.g. Design the new dashboard" autoFocus /></label><label>Description<textarea name="description" placeholder="What needs to happen?" /></label><label>Priority<select name="priority" defaultValue="Medium"><option>Low</option><option>Medium</option><option>High</option></select></label><button className="button primary submit">Create task <span>→</span></button></form>}</div></div>}
  </div>;
}

export { App };
