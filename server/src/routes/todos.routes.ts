import { Router } from 'express';
import { TodoStore } from '../store/todo.store';
import { createTodosController } from '../controllers/todos.controller';

export function createTodosRouter(store: TodoStore): Router {
  const router = Router();
  const controller = createTodosController(store);

  router.get('/', controller.list);
  router.post('/', controller.create);

  // Specific route must come before the generic '/:id' route.
  router.delete('/completed/clear', controller.clearCompleted);

  router.put('/:id', controller.update);
  router.patch('/:id/toggle', controller.toggle);
  router.delete('/:id', controller.remove);

  return router;
}
