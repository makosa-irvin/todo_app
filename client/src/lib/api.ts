import type { Todo } from '@/types/todo';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

/**
 * In production the client talks to the Render backend directly (set
 * NEXT_PUBLIC_API_URL in Vercel), rather than through Next's rewrite proxy —
 * routing every request through a Vercel serverless function adds a second
 * timeout on top of Render free-tier cold starts. Locally, with the env var
 * unset, this resolves to relative paths and next.config.mjs's rewrite still
 * proxies them to the server running on :4000 as before.
 */
function apiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? '';
  return `${base}${path}`;
}

async function parseJsonOrThrow(res: Response) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.error || `Request failed with status ${res.status}`);
  }
  return body;
}

export async function fetchTodos(): Promise<Todo[]> {
  const res = await fetch(apiUrl('/api/todos'), { method: 'GET' });
  return parseJsonOrThrow(res);
}

export async function createTodo(title: string): Promise<Todo> {
  const res = await fetch(apiUrl('/api/todos'), {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ title }),
  });
  return parseJsonOrThrow(res);
}

export async function updateTodo(id: string, changes: { title?: string; completed?: boolean }): Promise<Todo> {
  const res = await fetch(apiUrl(`/api/todos/${id}`), {
    method: 'PUT',
    headers: JSON_HEADERS,
    body: JSON.stringify(changes),
  });
  return parseJsonOrThrow(res);
}

export async function toggleTodo(id: string): Promise<Todo> {
  const res = await fetch(apiUrl(`/api/todos/${id}/toggle`), { method: 'PATCH' });
  return parseJsonOrThrow(res);
}

export async function deleteTodo(id: string): Promise<void> {
  const res = await fetch(apiUrl(`/api/todos/${id}`), { method: 'DELETE' });
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`);
  }
}

export async function clearCompletedTodos(): Promise<{ removed: number }> {
  const res = await fetch(apiUrl('/api/todos/completed/clear'), { method: 'DELETE' });
  return parseJsonOrThrow(res);
}
