# End-to-End Tests (Playwright + Gherkin)

The E2E suite runs the real Next.js client against the real Express API over HTTP. Gherkin feature files define the expected user behavior, while Playwright provides the executable browser tests.

## Behavior contract

The canonical behavior specification lives in:

```text
features/todo.feature
```

Each required scenario has a stable tag such as `@E2E-001`. The matching Playwright spec includes the same ID in its test title:

```gherkin
@E2E-002
Scenario: Add a new todo
  Given there are no todos
  When I add a todo named "Buy groceries"
  Then "Buy groceries" should appear in the list
```

```ts
test('[E2E-002] adds a new todo and displays it in the list', ...)
```

This keeps the human-readable Given/When/Then behavior separate from the browser implementation without introducing a second E2E runner.

## Behavior coverage gate

Run:

```bash
npm run test:behavior-coverage
```

The gate compares the `@E2E-###` scenarios in the Gherkin files with the `[E2E-###]` Playwright tests. It fails when:

- a required Gherkin scenario has no Playwright test;
- a Playwright behavior ID does not exist in Gherkin;
- a behavior ID is implemented more than once; or
- behavior coverage is below 100%.

`npm test` runs this gate before Playwright, so an uncovered behavior prevents the E2E suite from passing.

This is **behavior coverage**, not JavaScript line/branch coverage. The gate answers: "Does every behavior we declared in Given/When/Then form have an executable E2E test?"

## Setup

```bash
npm install
npm run install:browsers
```

## Run

Playwright starts both servers for you (`server` on :4000 and `client` on :3000) via `webServer` in `playwright.config.ts`.

```bash
npm test                       # behavior gate + all Playwright specs
npm run test:behavior-coverage # Gherkin/Playwright mapping only
npm run test:ui                # Playwright interactive UI
npm run test:headed            # headed browser
```

## Why serial, not parallel

Both servers share one in-memory todo store for the whole run. Each spec calls `clearAllTodos()` in `tests/helpers.ts` during `beforeEach`, using Playwright's request fixture to remove existing todos through the API. Tests run with `workers: 1` so cleanup from one spec cannot race with another spec's assertions.

## Behavior coverage

| ID | Behavior |
| --- | --- |
| E2E-001 | Empty state |
| E2E-002 | Add a todo |
| E2E-003 | Complete a todo |
| E2E-004 | Edit a todo |
| E2E-005 | Delete a todo |
| E2E-006 | Filter active/completed/all |
| E2E-007 | Clear completed only |
| E2E-008 | Full todo lifecycle |
| E2E-009 | Preserve backend state across reload |
| E2E-010 | Handle an unreachable API |

The current gate therefore requires **10/10 = 100% declared behavior coverage**.

## Adding a new behavior

Start with the behavior rather than the Playwright implementation:

1. Add a scenario to `features/todo.feature` with the next unique `@E2E-###` tag.
2. Run `npm run test:behavior-coverage`. It should fail and identify the missing case.
3. Add the corresponding Playwright test using `[E2E-###]` in the title.
4. Run `npm test` to satisfy the behavior gate and execute the browser test.

This makes an intentional new Given/When/Then requirement visible as an E2E coverage gap until it is implemented.

## Running against a live deployment

```bash
PLAYWRIGHT_BASE_URL=https://your-app.vercel.app \
PLAYWRIGHT_API_URL=https://todo-api.onrender.com \
npm test
```

When these variables are set, Playwright skips starting the local dev servers and points the browser and cleanup helper at the deployed applications. See the root `DEPLOYMENT.md` for deployment details.
