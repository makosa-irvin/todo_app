import { TodoStore } from '../src/store/todo.store';
import { Todo } from '../src/models/todo.model';

describe('TodoStore', () => {
  let store: TodoStore;

  beforeEach(() => {
    store = new TodoStore();
  });

  it('starts empty', () => {
    expect(store.getAll()).toEqual([]);
  });

  it('creates a todo with a generated id, timestamps, and completed=false', () => {
    const todo = store.create({ title: 'Buy milk' });

    expect(todo.id).toBeDefined();
    expect(todo.title).toBe('Buy milk');
    expect(todo.completed).toBe(false);
    expect(todo.createdAt).toBeDefined();
    expect(todo.updatedAt).toBe(todo.createdAt);
  });

  it('rejects creating a todo with an empty title', () => {
    expect(() => store.create({ title: '' })).toThrow('Title is required');
    expect(() => store.create({ title: '   ' })).toThrow('Title is required');
  });

  it('trims whitespace from a new todo title', () => {
    const todo = store.create({ title: '  Walk the dog  ' });
    expect(todo.title).toBe('Walk the dog');
  });

  it('returns all created todos in creation order', () => {
    store.create({ title: 'First' });
    store.create({ title: 'Second' });
    const all = store.getAll();
    expect(all.map((t: Todo) => t.title)).toEqual(['First', 'Second']);
  });

  it('finds a todo by id', () => {
    const created = store.create({ title: 'Find me' });
    expect(store.getById(created.id)).toEqual(created);
  });

  it('returns undefined when finding a non-existent id', () => {
    expect(store.getById('does-not-exist')).toBeUndefined();
  });

  it('updates a todo title and completed flag', () => {
    const created = store.create({ title: 'Old title' });
    const updated = store.update(created.id, { title: 'New title', completed: true });

    expect(updated?.title).toBe('New title');
    expect(updated?.completed).toBe(true);
    expect(updated?.id).toBe(created.id);
  });

  it('bumps updatedAt (and not createdAt) when updating', async () => {
    const created = store.create({ title: 'Track time' });
    const originalCreatedAt = created.createdAt;
    const originalUpdatedAt = created.updatedAt;

    await new Promise((r) => setTimeout(r, 15));
    const updated = store.update(created.id, { completed: true });

    expect(updated?.createdAt).toBe(originalCreatedAt);
    expect(updated?.updatedAt).not.toBe(originalUpdatedAt);
  });

  it('returns null when updating a non-existent todo', () => {
    expect(store.update('missing-id', { title: 'x' })).toBeNull();
  });

  it('rejects updating a todo to an empty title', () => {
    const created = store.create({ title: 'Keep me' });
    expect(() => store.update(created.id, { title: '   ' })).toThrow('Title is required');
  });

  it('deletes a todo by id and returns true', () => {
    const created = store.create({ title: 'Delete me' });
    expect(store.delete(created.id)).toBe(true);
    expect(store.getById(created.id)).toBeUndefined();
  });

  it('returns false when deleting a non-existent todo', () => {
    expect(store.delete('missing-id')).toBe(false);
  });

  it('toggles the completed flag', () => {
    const created = store.create({ title: 'Toggle me' });
    const toggled = store.toggle(created.id);
    expect(toggled?.completed).toBe(true);

    const toggledAgain = store.toggle(created.id);
    expect(toggledAgain?.completed).toBe(false);
  });

  it('returns null when toggling a non-existent todo', () => {
    expect(store.toggle('missing-id')).toBeNull();
  });

  it('clears completed todos and returns the count removed', () => {
    const a = store.create({ title: 'A' });
    store.create({ title: 'B' });
    store.toggle(a.id);

    const removed = store.clearCompleted();

    expect(removed).toBe(1);
    expect(store.getAll().map((t: Todo) => t.title)).toEqual(['B']);
  });
});
