# Ledger — a Todo App

Full-stack todo app: **Express + TypeScript** API and a **Next.js +
TypeScript** frontend styled with **Tailwind**, shadcn-style components, and
**Framer Motion**. Built entirely test-first (TDD): every module has a test
written before its implementation, run red, then made to pass.

```
todo-app/
  package.json   npm workspaces root — `npm run test:server` / `test:client` / `test:e2e` from here
  server/   Express API (in-memory store) — 30 tests
    tests/unit/          fast, isolated (TodoStore)
    tests/integration/   full app via supertest, real HTTP round-trip
  client/   Next.js app (App Router)      — 37 tests, colocated in __tests__/ next to each module
  e2e/      Playwright end-to-end tests   — 8 tests, spans both servers
```

## Quick start

Two terminals, from the repo root:

```bash
npm run dev:server   # API on :4000
npm run dev:client   # Web app on :3000
```

Open http://localhost:3000. The client proxies `/api/*` requests to the
Express server via a rewrite in `next.config.mjs`, so no CORS setup or env
vars are needed for local development.

## Run all tests

From the repo root (npm workspaces):

```bash
npm run test:server
npm run test:client
npm run test:e2e     # needs `cd e2e && npm run install:browsers` once first
npm run test:all     # server + client + e2e
```

Or per-package as before: `cd server && npm test`, etc.

67 unit/integration tests + 8 end-to-end tests, all passing:

| Suite | Tests | Covers |
|---|---|---|
| `server/tests/unit/todo.store.test.ts` | 16 | In-memory store: CRUD, validation, timestamps |
| `server/tests/integration/todos.api.test.ts` | 14 | REST endpoints via supertest |
| `client/src/lib/__tests__/api.test.ts` | 7 | Fetch wrapper, mocked `fetch` |
| `client/src/hooks/__tests__/useTodos.test.ts` | 10 | State hook: load/add/toggle/edit/delete/filter |
| `client/src/components/ui/__tests__/button.test.tsx` | 4 | Button primitive |
| `client/src/components/__tests__/AddTodoForm.test.tsx` | 4 | New-entry form |
| `client/src/components/__tests__/TodoItem.test.tsx` | 7 | Row: toggle, delete, inline edit |
| `client/src/components/__tests__/TodoList.test.tsx` | 5 | Filters, empty state, footer |
| `e2e/tests/todo-app.spec.ts` | 8 | Full user flows against the real client + server over HTTP |

The e2e suite needs its own browser binary (`npm run install:browsers`,
one-time, needs internet access) and, unlike the other two suites, actually
starts both dev servers and drives a real browser — see `e2e/README.md`.

## How the TDD loop was applied

For each module: write the test file against an API that doesn't exist yet →
run it and confirm it fails for the right reason (missing module, not a typo)
→ write the minimal implementation → run again until green → refactor while
staying green (e.g. the store was hardened to return defensive copies after
a test caught it returning internal references).

## Features

- Add, edit (double-click a task), toggle, and delete todos
- Filter by All / Active / Completed
- Clear all completed todos in one action
- Live counts ("N left · N done")
- Optimistic-feeling UI backed by real API round-trips, with inline error
  display if a request fails

## Stack

- **API**: Express 5, TypeScript, in-memory store, Jest + Supertest
- **Web**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn-style
  components (Button/Input via `class-variance-authority`), Framer Motion,
  Jest + React Testing Library
