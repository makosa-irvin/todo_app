import type { APIRequestContext } from '@playwright/test';

const API_URL = `${process.env.PLAYWRIGHT_API_URL || 'http://localhost:4000'}/api`;

/**
 * The backend is a single shared in-memory store across the whole test
 * run, so each test clears it first rather than assuming a clean slate.
 */
export async function clearAllTodos(request: APIRequestContext) {
  const res = await request.get(`${API_URL}/todos`);
  const todos: { id: string }[] = await res.json();
  await Promise.all(todos.map((todo) => request.delete(`${API_URL}/todos/${todo.id}`)));
}
