# End-to-End Tests (Playwright)

Runs the real Next.js client against the real Express API over HTTP —
the one thing the unit/integration tests can't prove: that the two apps
actually work together.

## Setup

```bash
npm install
npm run install:browsers   # downloads Chromium; needs internet access
```

## Run

Playwright starts both servers for you (`server` on :4000, `client` on
:3000) via `webServer` in `playwright.config.ts` — no need to start them
by hand first.

```bash
npm test          # headless, all 10 specs
npm run test:ui   # Playwright's interactive UI mode
npm run test:headed
```

If servers are already running locally (e.g. from your own `npm run dev`
in another terminal), Playwright reuses them instead of starting new ones.

## Why serial, not parallel

Both servers share one in-memory todo store for the whole run. Rather than
add a reset endpoint to the API just for tests, each spec calls
`clearAllTodos()` (in `tests/helpers.ts`) in `beforeEach`, using Playwright's
`request` fixture to list and delete existing todos through the same API
the app uses. Tests run with `workers: 1` so that cleanup from one spec
can't race with another spec's assertions.

## What's covered

| Spec | Verifies |
|---|---|
| Empty state | Renders "Nothing on the list" with zero todos |
| Add | New todo appears, count updates |
| Toggle | Strikethrough + "done" count |
| Edit | Double-click → inline edit → saved title |
| Delete | Row removed, empty state returns |
| Filter | All / Active / Completed tabs show the right subset |
| Clear completed | Removes only completed todos |
| Full lifecycle | Add → edit → complete → filter → delete, in one flow |
| Reload persistence | Add a todo, reload the page, it's still there — proves state comes from the backend, not local component state |
| Network failure | Aborts the `/api/todos` request via `context.route()`, confirms the `role="alert"` error message actually renders |

## Also runs against a live deployment

```bash
PLAYWRIGHT_BASE_URL=https://your-app.vercel.app \
PLAYWRIGHT_API_URL=https://todo-api.onrender.com \
npm test
```

Skips starting local dev servers and points the browser + API cleanup
helper at the given URLs instead — see the root `DEPLOYMENT.md`.
