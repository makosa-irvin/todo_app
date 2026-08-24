# Todo API (Express + TypeScript)

In-memory REST API for the todo app, built test-first with Jest + Supertest.

## Setup

```bash
npm install
```

## Run

```bash
npm run dev     # ts-node-dev, http://localhost:4000
npm run build && npm start   # compiled JS
```

## Test

```bash
npm test          # run once
npm run test:watch
```

30 tests: 16 unit tests on `TodoStore`, 14 integration tests on the API routes via supertest.

## Endpoints

| Method | Path                       | Description                    |
|--------|-----------------------------|--------------------------------|
| GET    | `/api/health`               | Health check                   |
| GET    | `/api/todos`                 | List all todos                 |
| POST   | `/api/todos`                 | Create a todo `{ title }`      |
| PUT    | `/api/todos/:id`             | Update `{ title?, completed? }`|
| PATCH  | `/api/todos/:id/toggle`      | Toggle completed               |
| DELETE | `/api/todos/:id`             | Delete a todo                  |
| DELETE | `/api/todos/completed/clear` | Remove all completed todos     |

## Architecture

```
src/
  models/todo.model.ts        Shared types
  store/todo.store.ts         In-memory data layer (swap for a DB later)
  controllers/todos.controller.ts   Request handlers
  routes/todos.routes.ts      Express Router
  app.ts                      App factory (used directly by tests, no listen())
  server.ts                   Entry point — creates the app and listens
tests/
  todo.store.test.ts          Unit tests for the store
  todos.api.test.ts           Integration tests against the app via supertest
```

`createApp()` takes an optional `TodoStore` so each test suite gets a fresh,
isolated store — no shared state or reset logic needed between tests.
