# Ledger — Todo App

A full-stack todo application built with a **Next.js + TypeScript** frontend and an **Express + TypeScript** API. The project includes unit, integration, and end-to-end tests and is structured as an npm workspace monorepo.

**Live application:** https://todo-app-client-weld.vercel.app/

## Features

- Create todos
- Edit todo titles by double-clicking an entry
- Mark todos as completed or active
- Delete individual todos
- Filter by **All**, **Active**, and **Completed**
- Clear all completed todos
- View live active/completed counts
- Display API errors in the interface
- Responsive interface with subtle animations

> **Note:** Todos are currently stored in memory by the API. Restarting or redeploying the server clears the stored todos. A persistent database would be required for production-grade data persistence.

## Tech Stack

### Frontend

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion
- Lucide React
- Jest
- React Testing Library

### Backend

- Node.js
- Express 5
- TypeScript
- In-memory todo store
- Jest
- Supertest

### End-to-End Testing

- Playwright

## Project Structure

```text
todo_app/
├── client/                 # Next.js frontend
│   ├── src/app/            # App Router pages and global styles
│   ├── src/components/     # Todo and reusable UI components
│   ├── src/hooks/          # Client-side todo state/data logic
│   ├── src/lib/            # API client and utilities
│   └── src/types/          # Frontend TypeScript types
├── server/                 # Express API
│   ├── src/controllers/    # HTTP request handlers
│   ├── src/models/         # API domain types
│   ├── src/routes/         # Express routes
│   └── src/store/          # In-memory data store
├── e2e/                    # Playwright end-to-end tests
├── DEPLOYMENT.md           # Deployment instructions
├── render.yaml             # Render API configuration
└── package.json            # npm workspace scripts
```

## Prerequisites

Install the following before running the project locally:

- Node.js 18.18 or newer
- npm

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/makosa-irvin/todo_app.git
cd todo_app
```

### 2. Install dependencies

Because the project uses npm workspaces, dependencies can be installed from the repository root:

```bash
npm install
```

### 3. Start the API

In one terminal:

```bash
npm run dev:server
```

The API runs at `http://localhost:4000` by default.

### 4. Start the frontend

In another terminal:

```bash
npm run dev:client
```

Open `http://localhost:3000` in your browser.

During local development, the Next.js configuration proxies `/api/*` requests to the Express server on port `4000` when `NEXT_PUBLIC_API_URL` is not set.

## Environment Variables

The frontend supports the following environment variable:

```env
NEXT_PUBLIC_API_URL=https://your-api.example.com
```

For local development it can normally be left unset because the Next.js rewrite proxies requests to `http://localhost:4000`.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production configuration.

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/health` | API health check |
| `GET` | `/api/todos` | List todos |
| `POST` | `/api/todos` | Create a todo |
| `PUT` | `/api/todos/:id` | Update a todo |
| `PATCH` | `/api/todos/:id/toggle` | Toggle completion status |
| `DELETE` | `/api/todos/:id` | Delete a todo |
| `DELETE` | `/api/todos/completed/clear` | Delete all completed todos |

### Todo shape

```json
{
  "id": "uuid",
  "title": "Example task",
  "completed": false,
  "createdAt": "2026-08-25T00:00:00.000Z",
  "updatedAt": "2026-08-25T00:00:00.000Z"
}
```

## Testing

The repository follows a test-pyramid approach with unit, integration, and browser-level end-to-end tests.

Run the server tests:

```bash
npm run test:server
```

Run the client tests:

```bash
npm run test:client
```

Run the end-to-end tests:

```bash
cd e2e
npm run install:browsers
cd ..
npm run test:e2e
```

Run all test suites:

```bash
npm run test:all
```

Coverage can also be generated from the individual packages:

```bash
cd server && npm run test:coverage
cd ../client && npm run test:coverage
```

Both Jest configurations enforce minimum coverage thresholds to help prevent regressions.

## Deployment

The application is designed to deploy as two services:

- **Frontend:** Vercel
- **API:** Render

The deployed frontend is available at:

**https://todo-app-client-weld.vercel.app/**

Detailed deployment and troubleshooting instructions are available in [DEPLOYMENT.md](./DEPLOYMENT.md).

## Architecture Notes

The frontend communicates with the Express REST API through `client/src/lib/api.ts`. In development, requests can use the Next.js rewrite proxy. In production, `NEXT_PUBLIC_API_URL` allows the browser to communicate directly with the deployed API.

The backend currently uses an in-memory `TodoStore`. The store is intentionally separated from the controllers and routes, which makes it possible to replace the in-memory implementation with a persistent database later without redesigning the API surface.

## Development Practices

The project includes:

- TypeScript on both frontend and backend
- Separation of routes, controllers, models, and storage logic
- Unit tests for isolated modules and UI components
- Integration tests for API and frontend behavior
- End-to-end tests for real browser flows
- Coverage thresholds for regression protection
- Environment-based production API configuration

## Known Limitation

Todo data is not persistent. Because the server uses an in-memory store, all todo records are lost whenever the API process restarts or the deployment is replaced. For a production application, the next major architectural improvement should be adding persistent storage such as PostgreSQL.

## License

The server and client package metadata currently declare the ISC license. If this repository is intended for public reuse, add a root `LICENSE` file so the repository-level licensing terms are explicit.
