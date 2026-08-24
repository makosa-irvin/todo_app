import { renderHook, act, waitFor } from '@testing-library/react';
import { useTodos } from '@/hooks/useTodos';
import * as api from '@/lib/api';
import type { Todo } from '@/types/todo';

jest.mock('@/lib/api');
const mockedApi = api as jest.Mocked<typeof api>;

function makeTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: overrides.id ?? '1',
    title: overrides.title ?? 'Todo',
    completed: overrides.completed ?? false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('useTodos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads todos on mount and exposes them once resolved', async () => {
    mockedApi.fetchTodos.mockResolvedValue([makeTodo({ id: '1', title: 'A' })]);

    const { result } = renderHook(() => useTodos());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.todos).toHaveLength(1);
    expect(result.current.todos[0].title).toBe('A');
  });

  it('surfaces an error message when the initial load fails', async () => {
    mockedApi.fetchTodos.mockRejectedValue(new Error('network down'));

    const { result } = renderHook(() => useTodos());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe('network down');
  });

  it('addTodo optimistically appends and reconciles with the server response', async () => {
    mockedApi.fetchTodos.mockResolvedValue([]);
    mockedApi.createTodo.mockResolvedValue(makeTodo({ id: 'server-1', title: 'New task' }));

    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.addTodo('New task');
    });

    expect(mockedApi.createTodo).toHaveBeenCalledWith('New task');
    expect(result.current.todos).toHaveLength(1);
    expect(result.current.todos[0].id).toBe('server-1');
  });

  it('does not call the API when adding a blank title', async () => {
    mockedApi.fetchTodos.mockResolvedValue([]);
    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.addTodo('   ');
    });

    expect(mockedApi.createTodo).not.toHaveBeenCalled();
    expect(result.current.todos).toHaveLength(0);
  });

  it('toggleTodo flips completed state via the API', async () => {
    const todo = makeTodo({ id: '1', completed: false });
    mockedApi.fetchTodos.mockResolvedValue([todo]);
    mockedApi.toggleTodo.mockResolvedValue({ ...todo, completed: true });

    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.toggleTodo('1');
    });

    expect(mockedApi.toggleTodo).toHaveBeenCalledWith('1');
    expect(result.current.todos[0].completed).toBe(true);
  });

  it('editTodo updates the title via the API', async () => {
    const todo = makeTodo({ id: '1', title: 'Old' });
    mockedApi.fetchTodos.mockResolvedValue([todo]);
    mockedApi.updateTodo.mockResolvedValue({ ...todo, title: 'New' });

    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.editTodo('1', 'New');
    });

    expect(mockedApi.updateTodo).toHaveBeenCalledWith('1', { title: 'New' });
    expect(result.current.todos[0].title).toBe('New');
  });

  it('deleteTodo removes the todo from state after the API call resolves', async () => {
    mockedApi.fetchTodos.mockResolvedValue([makeTodo({ id: '1' })]);
    mockedApi.deleteTodo.mockResolvedValue(undefined);

    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.deleteTodo('1');
    });

    expect(mockedApi.deleteTodo).toHaveBeenCalledWith('1');
    expect(result.current.todos).toHaveLength(0);
  });

  it('clearCompleted removes completed todos from state', async () => {
    mockedApi.fetchTodos.mockResolvedValue([
      makeTodo({ id: '1', completed: true }),
      makeTodo({ id: '2', completed: false }),
    ]);
    mockedApi.clearCompletedTodos.mockResolvedValue({ removed: 1 });

    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.clearCompleted();
    });

    expect(result.current.todos).toHaveLength(1);
    expect(result.current.todos[0].id).toBe('2');
  });

  it('computes counts for active and completed todos', async () => {
    mockedApi.fetchTodos.mockResolvedValue([
      makeTodo({ id: '1', completed: true }),
      makeTodo({ id: '2', completed: false }),
      makeTodo({ id: '3', completed: false }),
    ]);

    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.counts).toEqual({ active: 2, completed: 1, total: 3 });
  });

  it('filters todos by the current filter', async () => {
    mockedApi.fetchTodos.mockResolvedValue([
      makeTodo({ id: '1', completed: true, title: 'Done' }),
      makeTodo({ id: '2', completed: false, title: 'Not done' }),
    ]);

    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setFilter('completed'));
    expect(result.current.filteredTodos.map((t) => t.title)).toEqual(['Done']);

    act(() => result.current.setFilter('active'));
    expect(result.current.filteredTodos.map((t) => t.title)).toEqual(['Not done']);

    act(() => result.current.setFilter('all'));
    expect(result.current.filteredTodos).toHaveLength(2);
  });
});
