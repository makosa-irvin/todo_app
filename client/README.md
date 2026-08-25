# Todo Client (Next.js + TypeScript)

"Ledger" — a small daily todo list styled like a paper ledger. Built with
Next.js (App Router), Tailwind, shadcn-style components, and Framer Motion,
test-first with Jest + React Testing Library.

## Setup

```bash
npm install
```

## Run

Requires the API server running on port 4000 (see `../server`). Requests to
`/api/*` are proxied there via `next.config.mjs` rewrites.

```bash
npm run dev     # http://localhost:3000
```

## Test

```bash
npm test
npm run test:watch
npm run test:coverage   # enforces a 70% floor; currently ~95%
```

45 tests: 38 unit (API client, `useTodos` hook, every component) plus 7
integration tests in `src/__tests__/integration/` that render the real
`Page` wired to the real hook and API client, mocking only `fetch` itself.

## Deploy

See [`../DEPLOYMENT.md`](../DEPLOYMENT.md) for deploying this to Vercel.
Short version: set Root Directory to `client` and add one env var,
`NEXT_PUBLIC_API_URL`, pointing at your deployed Render backend.

## Architecture

```
src/
  types/todo.ts              Shared Todo/TodoFilter types
  lib/api.ts                 Thin fetch wrapper around the REST API
  hooks/useTodos.ts           All todo state + actions (load/add/toggle/edit/delete/filter)
  components/
    ui/button.tsx, ui/input.tsx   shadcn-style primitives
    AddTodoForm.tsx           New-entry input + submit
    TodoItem.tsx               Single ledger row: animated stamp checkbox, inline edit, delete
    TodoList.tsx                Filter tabs, animated list, footer tally
  app/
    layout.tsx, page.tsx, globals.css
  __tests__/integration/       Cross-module integration tests (see Testing below)
```

Every module above also has a co-located test written *before* its
implementation (`__tests__/*.test.ts(x)` next to it), following red → green
TDD.

## Testing layers

- **Unit** (`src/**/__tests__/`): one module at a time, everything it
  depends on is mocked. Fast, and pinpoints exactly what broke.
- **Integration** (`src/__tests__/integration/`): `Page` + `useTodos` + the
  real `api.ts` module all run together, with only `global.fetch` mocked
  (a small in-memory fake backend). Catches wiring bugs unit tests can't —
  e.g. a prop name mismatch between the hook and a component, or a state
  update that works in isolation but not through the real hook.
- **E2E** (`../e2e/`): real browser, real Next.js server, real Express
  server. See `../e2e/README.md`.


## Design

A "ledger" aesthetic: warm paper background with a faint ruled-line texture,
an editorial serif (Fraunces) for entries, monospace (IBM Plex Mono) for
metadata like the date and tallies, pine-green for completed/primary actions,
and a burnt-rust accent for the add action. The signature interaction is the
checkbox: completing a task triggers a small spring-animated "stamp" rather
than a plain checkmark swap.
