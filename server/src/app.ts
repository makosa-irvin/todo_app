import express, { Express } from 'express';
import cors from 'cors';
import { TodoStore } from './store/todo.store';
import { createTodosRouter } from './routes/todos.routes';

export function createApp(store: TodoStore = new TodoStore()): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api/todos', createTodosRouter(store));

  // Fallback error handler for unexpected errors thrown synchronously in handlers.
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(500).json({ error: err.message || 'Internal server error' });
  });

  return app;
}
