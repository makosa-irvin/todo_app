import request from 'supertest';
import { createApp } from '../../src/app';
import { TodoStore } from '../../src/store/todo.store';

describe('Todos API', () => {
  let app: ReturnType<typeof createApp>;
  let store: TodoStore;

  beforeEach(() => {
    store = new TodoStore();
    app = createApp(store);
  });

  describe('GET /api/todos', () => {
    it('returns an empty array when there are no todos', async () => {
      const res = await request(app).get('/api/todos');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns all existing todos', async () => {
      store.create({ title: 'Existing todo' });
      const res = await request(app).get('/api/todos');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('Existing todo');
    });
  });

  describe('POST /api/todos', () => {
    it('creates a todo and returns 201 with the created resource', async () => {
      const res = await request(app).post('/api/todos').send({ title: 'New todo' });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('New todo');
      expect(res.body.completed).toBe(false);
      expect(res.body.id).toBeDefined();
    });

    it('returns 400 when title is missing', async () => {
      const res = await request(app).post('/api/todos').send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('returns 400 when title is blank', async () => {
      const res = await request(app).post('/api/todos').send({ title: '   ' });
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/todos/:id', () => {
    it('updates an existing todo', async () => {
      const created = store.create({ title: 'Before' });

      const res = await request(app)
        .put(`/api/todos/${created.id}`)
        .send({ title: 'After', completed: true });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('After');
      expect(res.body.completed).toBe(true);
    });

    it('returns 404 when updating a non-existent todo', async () => {
      const res = await request(app).put('/api/todos/missing-id').send({ title: 'x' });
      expect(res.status).toBe(404);
    });

    it('returns 400 when updating with a blank title', async () => {
      const created = store.create({ title: 'Valid' });
      const res = await request(app).put(`/api/todos/${created.id}`).send({ title: '  ' });
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/todos/:id/toggle', () => {
    it('toggles completed status', async () => {
      const created = store.create({ title: 'Toggle target' });

      const res = await request(app).patch(`/api/todos/${created.id}/toggle`);

      expect(res.status).toBe(200);
      expect(res.body.completed).toBe(true);
    });

    it('returns 404 when toggling a non-existent todo', async () => {
      const res = await request(app).patch('/api/todos/missing-id/toggle');
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/todos/:id', () => {
    it('deletes an existing todo and returns 204', async () => {
      const created = store.create({ title: 'Delete target' });

      const res = await request(app).delete(`/api/todos/${created.id}`);
      expect(res.status).toBe(204);

      const getRes = await request(app).get('/api/todos');
      expect(getRes.body).toEqual([]);
    });

    it('returns 404 when deleting a non-existent todo', async () => {
      const res = await request(app).delete('/api/todos/missing-id');
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/todos/completed/clear', () => {
    it('removes all completed todos and reports how many were removed', async () => {
      const a = store.create({ title: 'A' });
      store.create({ title: 'B' });
      store.toggle(a.id);

      const res = await request(app).delete('/api/todos/completed/clear');

      expect(res.status).toBe(200);
      expect(res.body.removed).toBe(1);
    });
  });

  describe('GET /api/health', () => {
    it('returns ok status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });
});
