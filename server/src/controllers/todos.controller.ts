import { Request, Response } from 'express';
import { TodoStore } from '../store/todo.store';

export function createTodosController(store: TodoStore) {
  return {
    list(_req: Request, res: Response) {
      res.status(200).json(store.getAll());
    },

    create(req: Request, res: Response) {
      try {
        const todo = store.create({ title: req.body?.title });
        res.status(201).json(todo);
      } catch (err) {
        res.status(400).json({ error: (err as Error).message });
      }
    },

    update(req: Request, res: Response) {
      try {
        const updated = store.update(String(req.params.id), {
          title: req.body?.title,
          completed: req.body?.completed,
        });
        if (!updated) {
          res.status(404).json({ error: 'Todo not found' });
          return;
        }
        res.status(200).json(updated);
      } catch (err) {
        res.status(400).json({ error: (err as Error).message });
      }
    },

    toggle(req: Request, res: Response) {
      const toggled = store.toggle(String(req.params.id));
      if (!toggled) {
        res.status(404).json({ error: 'Todo not found' });
        return;
      }
      res.status(200).json(toggled);
    },

    remove(req: Request, res: Response) {
      const deleted = store.delete(String(req.params.id));
      if (!deleted) {
        res.status(404).json({ error: 'Todo not found' });
        return;
      }
      res.status(204).send();
    },

    clearCompleted(_req: Request, res: Response) {
      const removed = store.clearCompleted();
      res.status(200).json({ removed });
    },
  };
}
