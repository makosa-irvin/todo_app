# Ledger — a Todo App

Full-stack todo app: **Express + TypeScript** API and a **Next.js +
TypeScript** frontend styled with **Tailwind**, shadcn-style components, and
**Framer Motion**. Built entirely test-first (TDD): every module has a test
written before its implementation, run red, then made to pass.

```
todo-app/
  package.json   npm workspaces root — `npm run test:server` / `test:client` / `test:e2e` from here
  render.yaml    Render Blueprint for the API
  DEPLOYMENT.md  Render + Vercel deployment guide
  server/   Express API (in-memory store) — 30 tests, ≥70% coverage enforced
    tests/unit/          fast, isolated (TodoStore)
    tests/integration/   full app via supertest, real HTTP round-trip
  client/   Next.js app (App Router)      — 45 tests, ≥70% coverage enforced
    src/**/__tests__/            unit — one module, neighbors mocked
    src/__tests__/integration/   Page + hook + api.ts together, only fetch mocked
  e2e/      Playwright end-to-end tests   — 10 tests, real client + server, real browser
```

This follows the standard test pyramid — many fast unit tests at the base,
fewer integration tests in the middle, a handful of end-to-end tests at the
top:

| Layer | Where | What's real | What's mocked |
|---|---|---|---|
| **Unit** | `server/tests/unit`, `client/src/**/__tests__` | One module | Everything it talks to |
| **Integration** | `server/tests/integration`, `client/src/__tests__/integration` | Server: the whole Express app + real store, over HTTP via supertest. Client: `Page` + `useTodos` + `api.ts` together | Server: nothing. Client: only `fetch` itself, via a tiny in-memory fake backend |
| **E2E** | `e2e/tests` | Real Next.js server + real Express server + real Chromium browser | Nothing — this is the only layer that would catch, say, a CORS misconfiguration or a rewrite-proxy mistake |

## Quick start

Two terminals, from the repo root:

```bash
npm run dev:server   # API on :4000
npm run dev:client   # Web app on :3000
```

Open http://localhost:3000. The client proxies `/api/*` requests to the
Express server via a rewrite in `next.config.mjs`, so no CORS setup or env
vars are needed for local development. (In production this changes — see
Deployment below.)

## Deployment

See [`DEPLOYMENT.md`](./DEPLOYMENT.md): Render for the API, Vercel for the
client, linked by one env var (`NEXT_PUBLIC_API_URL`). `render.yaml` at the
repo root is a ready-to-use Blueprint for the API side.

## Run all tests

From the repo root (npm workspaces):

```bash
npm run test:server
npm run test:client
npm run test:e2e     # needs `cd e2e && npm run install:browsers` once first
npm run test:all     # server + client + e2e
```

Or per-package as before: `cd server && npm test`, etc. Coverage reports:
`cd server && npm run test:coverage`, same in `client/`.

85 tests total across all three layers, all passing:

| Suite | Tests | Layer | Covers |
|---|---|---|---|
| `server/tests/unit/todo.store.test.ts` | 16 | Unit | In-memory store: CRUD, validation, timestamps |
| `server/tests/integration/todos.api.test.ts` | 14 | Integration | REST endpoints via supertest |
| `client/src/lib/__tests__/api.test.ts` | 8 | Unit | Fetch wrapper, mocked `fetch`, including the NEXT_PUBLIC_API_URL prefix used in production |
| `client/src/hooks/__tests__/useTodos.test.ts` | 10 | Unit | State hook: load/add/toggle/edit/delete/filter |
| `client/src/components/ui/__tests__/button.test.tsx` | 4 | Unit | Button primitive |
| `client/src/components/__tests__/AddTodoForm.test.tsx` | 4 | Unit | New-entry form |
| `client/src/components/__tests__/TodoItem.test.tsx` | 7 | Unit | Row: toggle, delete, inline edit |
| `client/src/components/__tests__/TodoList.test.tsx` | 5 | Unit | Filters, empty state, footer |
| `client/src/__tests__/integration/todo-app.test.tsx` | 7 | Integration | Page + useTodos + api.ts wired together, network mocked |
| `e2e/tests/todo-app.spec.ts` | 10 | E2E | Full user flows against the real client + server over HTTP, real browser |

**Coverage**: both `server` and `client` enforce a 70% floor (statements/
branches/functions/lines) via `coverageThreshold` in their Jest configs —
`npm run test:coverage` fails the build if either drops below it. Both sit
well above it today (server: 98.96%/84%/96%/98.87%, client: 94.73%/82.69%/
98.07%/95.97%); the floor exists to catch future regressions, not because
either is currently tight.

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
