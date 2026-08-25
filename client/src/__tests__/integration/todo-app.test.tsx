import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Page from '@/app/page';
import type { Todo } from '@/types/todo';

/**
 * AnimatePresence keeps an exiting element mounted in the DOM until its exit
 * animation completes — jsdom doesn't run real animations, so that never
 * happens, and a filtered-out or deleted row would otherwise still be
 * present when an assertion runs immediately after. This integration suite
 * is testing data flow, not animation timing (that's covered by real-browser
 * behavior in the e2e suite), so motion components are stubbed to render/
 * unmount their children synchronously.
 */
jest.mock('framer-motion', () => {
  const React = require('react');
  const stripMotionProps = ({
    initial,
    animate,
    exit,
    transition,
    layout,
    whileHover,
    whileTap,
    ...rest
  }: Record<string, unknown>) => rest;

  return {
    motion: new Proxy(
      {},
      {
        get: (_target, tag: string) =>
          React.forwardRef((props: Record<string, unknown>, ref: unknown) =>
            React.createElement(tag, { ...stripMotionProps(props), ref }, props.children),
          ),
      },
    ),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

/**
 * Unlike the colocated unit tests (which mock '@/lib/api' or '@/hooks/useTodos'
 * to isolate one module), this suite mocks only global.fetch — the actual
 * network boundary — so Page, useTodos, and api.ts all run for real together.
 * A tiny in-memory fake stands in for the backend, mirroring the real
 * TodoStore's behavior closely enough to exercise the full request/response
 * cycle without needing a live server in the Jest environment.
 */
function mockBackend(initial: Todo[] = []) {
  let todos = [...initial];
  let nextId = todos.length + 1;

  global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method || 'GET').toUpperCase();
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    const json = (data: unknown, status = 200) =>
      ({ ok: status < 400, status, json: async () => data }) as Response;

    if (url.endsWith('/api/todos') && method === 'GET') {
      return json([...todos]); // copy — a live reference here would let the
      // mock's later mutations (push/filter below) leak into React state,
      // the same class of bug the real TodoStore was hardened against earlier.
    }
    if (url.endsWith('/api/todos') && method === 'POST') {
      const title = body?.title?.trim();
      if (!title) return json({ error: 'Title is required' }, 400);
      const now = new Date().toISOString();
      const created: Todo = { id: String(nextId++), title, completed: false, createdAt: now, updatedAt: now };
      todos.push(created);
      return json(created, 201);
    }
    if (url.endsWith('/toggle') && method === 'PATCH') {
      const id = url.match(/\/api\/todos\/(.+)\/toggle$/)?.[1];
      const todo = todos.find((t) => t.id === id);
      if (!todo) return json({ error: 'not found' }, 404);
      todo.completed = !todo.completed;
      return json(todo);
    }
    if (url.includes('/completed/clear') && method === 'DELETE') {
      const before = todos.length;
      todos = todos.filter((t) => !t.completed);
      return json({ removed: before - todos.length });
    }
    if (url.match(/\/api\/todos\/[^/]+$/) && method === 'DELETE') {
      const id = url.match(/\/api\/todos\/([^/]+)$/)?.[1];
      todos = todos.filter((t) => t.id !== id);
      return json(undefined, 204);
    }
    if (url.match(/\/api\/todos\/[^/]+$/) && method === 'PUT') {
      const id = url.match(/\/api\/todos\/([^/]+)$/)?.[1];
      const todo = todos.find((t) => t.id === id);
      if (!todo) return json({ error: 'not found' }, 404);
      if (body?.title !== undefined) todo.title = body.title;
      if (body?.completed !== undefined) todo.completed = body.completed;
      return json(todo);
    }

    throw new Error(`Unhandled mock request: ${method} ${url}`);
  }) as unknown as typeof fetch;

  return { get currentTodos() { return todos; } };
}

describe('Todo app integration (Page + useTodos + api.ts, network mocked)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('loads and displays todos fetched from the backend on mount', async () => {
    mockBackend([{ id: '1', title: 'Existing task', completed: false, createdAt: '', updatedAt: '' }]);
    render(<Page />);

    expect(await screen.findByText('Existing task')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith('/api/todos', expect.objectContaining({ method: 'GET' }));
  });

  it('adds a todo through the full stack: form submit → hook → api → re-render', async () => {
    mockBackend([]);
    render(<Page />);
    await waitFor(() => expect(screen.getByText(/nothing on the list/i)).toBeInTheDocument());

    await userEvent.type(screen.getByPlaceholderText(/add a task/i), 'New integration task');
    await userEvent.click(screen.getByRole('button', { name: 'Add task' }));

    expect(await screen.findByText('New integration task')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/todos',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ title: 'New integration task' }) }),
    );
  });

  it('toggles a todo end-to-end and updates the footer count', async () => {
    mockBackend([{ id: '1', title: 'Toggle me', completed: false, createdAt: '', updatedAt: '' }]);
    render(<Page />);
    await screen.findByText('Toggle me');

    await userEvent.click(screen.getByRole('checkbox', { name: 'Mark as done' }));

    await waitFor(() => expect(screen.getByText('Toggle me')).toHaveClass(/line-through/));
    expect(screen.getByText(/0 left · 1 done/i)).toBeInTheDocument();
  });

  it('deletes a todo end-to-end', async () => {
    mockBackend([{ id: '1', title: 'Delete me', completed: false, createdAt: '', updatedAt: '' }]);
    render(<Page />);
    await screen.findByText('Delete me');

    await userEvent.click(screen.getByRole('button', { name: 'Delete task' }));

    await waitFor(() => expect(screen.queryByText('Delete me')).not.toBeInTheDocument());
    expect(await screen.findByText(/nothing on the list/i)).toBeInTheDocument();
  });

  it('filters the displayed list client-side without issuing another fetch', async () => {
    mockBackend([
      { id: '1', title: 'Active one', completed: false, createdAt: '', updatedAt: '' },
      { id: '2', title: 'Done one', completed: true, createdAt: '', updatedAt: '' },
    ]);
    render(<Page />);
    await screen.findByText('Active one');
    const callsAfterLoad = (global.fetch as jest.Mock).mock.calls.length;

    await userEvent.click(screen.getByRole('button', { name: 'Active' }));

    expect(screen.getByText('Active one')).toBeInTheDocument();
    expect(screen.queryByText('Done one')).not.toBeInTheDocument();
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(callsAfterLoad);
  });

  it('clears completed todos end-to-end, leaving active ones', async () => {
    mockBackend([
      { id: '1', title: 'Keep me', completed: false, createdAt: '', updatedAt: '' },
      { id: '2', title: 'Clear me', completed: true, createdAt: '', updatedAt: '' },
    ]);
    render(<Page />);
    await screen.findByText('Clear me');

    await userEvent.click(screen.getByRole('button', { name: /clear completed/i }));

    await waitFor(() => expect(screen.queryByText('Clear me')).not.toBeInTheDocument());
    expect(screen.getByText('Keep me')).toBeInTheDocument();
  });

  it('shows an inline error message when the initial load fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Backend unreachable' }),
    }) as unknown as typeof fetch;

    render(<Page />);

    expect(await screen.findByText('Backend unreachable')).toBeInTheDocument();
  });
});
