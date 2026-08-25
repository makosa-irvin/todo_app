import { fetchTodos, createTodo, updateTodo, toggleTodo, deleteTodo, clearCompletedTodos } from '@/lib/api';
import type { Todo } from '@/types/todo';

const sampleTodo: Todo = {
  id: '1',
  title: 'Sample',
  completed: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function mockFetchOnce(body: unknown, ok = true, status = 200) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status,
    json: async () => body,
  }) as unknown as typeof fetch;
}

describe('api client', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('fetchTodos GETs /api/todos and returns the parsed list', async () => {
    mockFetchOnce([sampleTodo]);
    const todos = await fetchTodos();

    expect(global.fetch).toHaveBeenCalledWith('/api/todos', expect.objectContaining({ method: 'GET' }));
    expect(todos).toEqual([sampleTodo]);
  });

  it('fetchTodos throws when the response is not ok', async () => {
    mockFetchOnce({ error: 'boom' }, false, 500);
    await expect(fetchTodos()).rejects.toThrow('boom');
  });

  it('createTodo POSTs the title and returns the created todo', async () => {
    mockFetchOnce(sampleTodo, true, 201);
    const todo = await createTodo('Sample');

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/todos',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Sample' }),
      }),
    );
    expect(todo).toEqual(sampleTodo);
  });

  it('updateTodo PUTs the changes to the right id', async () => {
    mockFetchOnce({ ...sampleTodo, title: 'Updated' });
    const todo = await updateTodo('1', { title: 'Updated' });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/todos/1',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated' }),
      }),
    );
    expect(todo.title).toBe('Updated');
  });

  it('toggleTodo PATCHes the toggle endpoint for the right id', async () => {
    mockFetchOnce({ ...sampleTodo, completed: true });
    const todo = await toggleTodo('1');

    expect(global.fetch).toHaveBeenCalledWith('/api/todos/1/toggle', expect.objectContaining({ method: 'PATCH' }));
    expect(todo.completed).toBe(true);
  });

  it('deleteTodo DELETEs the right id', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 204 }) as unknown as typeof fetch;
    await deleteTodo('1');

    expect(global.fetch).toHaveBeenCalledWith('/api/todos/1', expect.objectContaining({ method: 'DELETE' }));
  });

  it('clearCompletedTodos DELETEs the clear-completed endpoint and returns the removed count', async () => {
    mockFetchOnce({ removed: 2 });
    const result = await clearCompletedTodos();

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/todos/completed/clear',
      expect.objectContaining({ method: 'DELETE' }),
    );
    expect(result.removed).toBe(2);
  });

  it('prefixes requests with NEXT_PUBLIC_API_URL when it is set, for calling a deployed backend directly', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://todo-api.onrender.com';
    mockFetchOnce([sampleTodo]);

    await fetchTodos();

    expect(global.fetch).toHaveBeenCalledWith(
      'https://todo-api.onrender.com/api/todos',
      expect.objectContaining({ method: 'GET' }),
    );

    delete process.env.NEXT_PUBLIC_API_URL;
  });
});
