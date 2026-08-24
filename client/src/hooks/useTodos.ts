'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchTodos, createTodo, updateTodo, toggleTodo as toggleTodoApi, deleteTodo as deleteTodoApi, clearCompletedTodos } from '@/lib/api';
import type { Todo, TodoFilter } from '@/types/todo';

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TodoFilter>('all');

  useEffect(() => {
    let cancelled = false;

    fetchTodos()
      .then((data) => {
        if (!cancelled) setTodos(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const addTodo = useCallback(async (title: string) => {
    if (!title.trim()) return;
    try {
      const created = await createTodo(title.trim());
      setTodos((prev) => [...prev, created]);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  const toggleTodo = useCallback(async (id: string) => {
    try {
      const updated = await toggleTodoApi(id);
      setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  const editTodo = useCallback(async (id: string, title: string) => {
    if (!title.trim()) return;
    try {
      const updated = await updateTodo(id, { title: title.trim() });
      setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  const deleteTodo = useCallback(async (id: string) => {
    try {
      await deleteTodoApi(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  const clearCompleted = useCallback(async () => {
    try {
      await clearCompletedTodos();
      setTodos((prev) => prev.filter((t) => !t.completed));
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  const counts = useMemo(() => {
    const completed = todos.filter((t) => t.completed).length;
    return { active: todos.length - completed, completed, total: todos.length };
  }, [todos]);

  const filteredTodos = useMemo(() => {
    if (filter === 'active') return todos.filter((t) => !t.completed);
    if (filter === 'completed') return todos.filter((t) => t.completed);
    return todos;
  }, [todos, filter]);

  return {
    todos,
    filteredTodos,
    isLoading,
    error,
    filter,
    setFilter,
    counts,
    addTodo,
    toggleTodo,
    editTodo,
    deleteTodo,
    clearCompleted,
  };
}
