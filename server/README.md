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
npm test                # everything
npm run test:unit       # tests/unit only — fast, no HTTP
npm run test:integration  # tests/integration only — full app via supertest
npm run test:watch
npm run test:coverage   # enforces a 70% floor; currently ~99% statements
```

30 tests: 16 unit tests on `TodoStore` (`tests/unit/`), 14 integration tests on the API routes via supertest (`tests/integration/`).

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

## Deploy

See [`../DEPLOYMENT.md`](../DEPLOYMENT.md) for deploying this to Render.
Short version: no code changes needed — `server.ts` already reads
`process.env.PORT`, and `render.yaml` at the repo root is a ready-to-use
Blueprint.

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
  unit/todo.store.test.ts         Unit tests for the store, no HTTP involved
  integration/todos.api.test.ts   Integration tests against the app via supertest
```

`createApp()` takes an optional `TodoStore` so each test suite gets a fresh,
isolated store — no shared state or reset logic needed between tests.
