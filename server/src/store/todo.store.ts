import { randomUUID } from 'crypto';
import { Todo, CreateTodoInput, UpdateTodoInput } from '../models/todo.model';

/**
 * In-memory storage for todos. Swappable later for a real database
 * behind the same interface (getAll/getById/create/update/delete/toggle).
 */
export class TodoStore {
  private todos: Todo[] = [];

  getAll(): Todo[] {
    return this.todos.map((t) => ({ ...t }));
  }

  getById(id: string): Todo | undefined {
    const todo = this.todos.find((t) => t.id === id);
    return todo ? { ...todo } : undefined;
  }

  private findInternal(id: string): Todo | undefined {
    return this.todos.find((t) => t.id === id);
  }

  create(input: CreateTodoInput): Todo {
    const title = input.title?.trim();
    if (!title) {
      throw new Error('Title is required');
    }

    const now = new Date().toISOString();
    const todo: Todo = {
      id: randomUUID(),
      title,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };

    this.todos.push(todo);
    return { ...todo };
  }

  update(id: string, input: UpdateTodoInput): Todo | null {
    const todo = this.findInternal(id);
    if (!todo) return null;

    if (input.title !== undefined) {
      const title = input.title.trim();
      if (!title) {
        throw new Error('Title is required');
      }
      todo.title = title;
    }

    if (input.completed !== undefined) {
      todo.completed = input.completed;
    }

    todo.updatedAt = new Date().toISOString();
    return { ...todo };
  }

  toggle(id: string): Todo | null {
    const todo = this.findInternal(id);
    if (!todo) return null;
    todo.completed = !todo.completed;
    todo.updatedAt = new Date().toISOString();
    return { ...todo };
  }

  delete(id: string): boolean {
    const index = this.todos.findIndex((t) => t.id === id);
    if (index === -1) return false;
    this.todos.splice(index, 1);
    return true;
  }

  clearCompleted(): number {
    const before = this.todos.length;
    this.todos = this.todos.filter((t) => !t.completed);
    return before - this.todos.length;
  }
}
