# Deploying: Render (API) + Vercel (client)

The client calls the API directly from the browser in production (see
`client/src/lib/api.ts`), so the two pieces deploy independently — there's
no shared build step or proxy to keep in sync, just one env var linking
them together.

## 1. Deploy the API to Render

### Option A — Blueprint (one click)

1. Push this repo to GitHub/GitLab.
2. In the Render dashboard: **New → Blueprint**, point it at the repo.
   Render reads `render.yaml` at the repo root and finds the `server/`
   service automatically (`rootDir: server`).
3. Click **Apply**. Render runs `npm install --include=dev && npm run build`
   then `npm start`, and polls `/api/health` to know when it's live.

### Option B — Manual web service

If you'd rather not use the blueprint, or it doesn't parse (Render's schema
does change over time — check their current docs if `Apply` fails):

1. **New → Web Service**, connect the repo.
2. **Root Directory**: `server`
3. **Build Command**: `npm install --include=dev && npm run build`
4. **Start Command**: `npm start`
5. **Health Check Path**: `/api/health`
6. Leave the plan on Free to start.

**Why `--include=dev`**: Render sets `NODE_ENV=production` for the build
environment (also set explicitly in `render.yaml`), and `npm install`
skips `devDependencies` whenever `NODE_ENV=production` is set — including
`typescript` itself, which the build needs. Without this flag, `tsc` isn't
installed locally, and depending on what else is available in the build
image, the build either fails outright or (worse) silently picks up a
different TypeScript version than the one this project was tested against,
which can surface as unrelated-looking compiler errors (e.g.
`moduleResolution=node10 has been removed`, a TS 6+ error, on a project
pinned to TS 5.6.3).

Either way, no extra env vars are required — `server.ts` already reads
`process.env.PORT`, which Render sets automatically. Once deployed, note
the URL Render gives you, e.g. `https://todo-api.onrender.com`.

**Free tier cold starts**: Render's free web services spin down after ~15
minutes of inactivity and take 30–50s to wake back up on the next request.
The first request after a quiet period will be slow — that's Render, not a
bug in this app. If that matters for your use case, upgrade the service to
a paid plan, which stays warm.

## 2. Deploy the client to Vercel

1. In the Vercel dashboard: **Add New → Project**, import the repo.
2. **Root Directory**: `client` (Vercel auto-detects Next.js once you set
   this — no other build config needed).
3. **Environment Variables** → add:
   ```
   NEXT_PUBLIC_API_URL = https://todo-api.onrender.com
   ```
   (your actual Render URL from step 1, no trailing slash)
4. Deploy.

Or via the CLI, from the repo root:

```bash
cd client
npx vercel                       # first deploy, follow the prompts
npx vercel env add NEXT_PUBLIC_API_URL production
npx vercel --prod
```

## 3. Verify

Open the Vercel URL, add a todo, refresh — it should still be there (backed
by the Render API, not local state). If it's not working:

- Open the browser's Network tab — are requests going to your Render URL,
  or still to `/api/...` on the Vercel domain? If the latter,
  `NEXT_PUBLIC_API_URL` wasn't set at build time — Next.js inlines
  `NEXT_PUBLIC_*` vars into the client bundle at build, so setting it *after*
  a deploy requires triggering a new build, not just a redeploy of the same
  build.
- CORS errors in the console? The server's `cors()` call (no options) allows
  all origins by default, so this shouldn't happen — but if you've since
  locked it down, make sure the Vercel domain is allowed.
- Slow first load? See the cold-start note above — try again after a few
  seconds.

## 4. (Optional) Smoke-test the live deployment with the e2e suite

```bash
cd e2e
PLAYWRIGHT_BASE_URL=https://your-app.vercel.app \
PLAYWRIGHT_API_URL=https://todo-api.onrender.com \
npm test
```

This runs the same 10 specs from `e2e/README.md` against the real deployed
apps instead of localhost — useful right after a deploy, or in CI as a
post-deploy check. Local runs (without these env vars) are unaffected.

## Troubleshooting

**`error TS5108: Option 'moduleResolution=node10' has been removed`** during
the Render build — see the `--include=dev` note under step 1. If you're
using the manual setup and already have this flag, double check the exact
build command Render is actually running (dashboard → the service → Settings
→ Build Command) hasn't drifted from what's documented here.

**Build succeeds but the service immediately crashes on start** — check
Render's logs for `Cannot find module '.../dist/server.js'`. This project's
`tsconfig.json` scopes `rootDir`/`include` to `src/` specifically so `tsc`
outputs `dist/server.js` directly (matching the `start` script); if you've
customized the TypeScript config and broadened `include` back to the repo
root (e.g. to include `tests/`), the compiled output will mirror that wider
path instead (`dist/src/server.js`), and `npm start` will look in the wrong
place.
