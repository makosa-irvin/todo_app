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
```

37 tests covering the API client, the `useTodos` state hook, and every
component (Button, AddTodoForm, TodoItem, TodoList).

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
```

Every module above has a co-located test written *before* its implementation
(`__tests__/*.test.ts(x)`), following red → green TDD.

## Design

A "ledger" aesthetic: warm paper background with a faint ruled-line texture,
an editorial serif (Fraunces) for entries, monospace (IBM Plex Mono) for
metadata like the date and tallies, pine-green for completed/primary actions,
and a burnt-rust accent for the add action. The signature interaction is the
checkbox: completing a task triggers a small spring-animated "stamp" rather
than a plain checkmark swap.
