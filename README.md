# brewrovision

Score keeping + live stream overlay for the **Panomaju Invitational** — an
Eurovision-style international homebrew team championship.

Seven countries (Finland, England, Scotland, Ireland, Denmark, Croatia, Poland)
compete across five BJCP categories (Pale Lager, Pale Belgian Beer, IPA, Dark
Strong Ales, Sour Beers). Each country ranks the others per category and awards
points on the ladder **12, 10, 8, 6, 4, 2**. The Jyväskylä crew enters every
country's points, then reveals them one ballot at a time onto the live overlay.

## Architecture

A single app, one deploy:

- **Server** — Hono (`src/server`): REST API + websocket, and serves the built
  client. Talks to SQLite via Kysely.
- **Client** — Lit + Suunta router (`src/client`), built by Vite.
- **Database** — SQLite file on disk (WAL mode). One process writes; write
  volume for a single-evening competition is tiny.

Three routes:

- `/` — transparent stream overlay (animated leaderboard, keys over video)
- `/admin` — score-entry console
- `/standings` — overall + per-category results

## Run with Docker (production, e.g. Hetzner)

```bash
docker compose up -d --build
```

Brings up the app, runs migrations automatically, and serves everything on
`127.0.0.1:3000`. The SQLite file lives in a named volume (`db-data` →
`/data/brewrovision.db`), so it survives container rebuilds.

The container binds to loopback only — put nginx or Caddy in front of it and
let the reverse proxy terminate TLS. Example Caddyfile:

```
brewrovision.example.com {
    reverse_proxy 127.0.0.1:3000
}
```

Caddy handles websocket upgrades on `/ws` automatically.

## Local development

```bash
npm install
cp .env.example .env          # adjust DATABASE_PATH if needed
npm run migrate               # create tables + seed countries/categories
npm run dev                   # server on :3000, Vite client on :8000
```

Open http://localhost:8000. The Vite dev server proxies `/api` and `/ws` to the
server, so everything is same-origin. The SQLite file defaults to
`./data/brewrovision.db` (git-ignored).

## Notes

- Migrations are idempotent (`npm run migrate`); safe to run on every deploy.
- No auth — this is a private site on a trusted network, by design.
- Handler errors are caught by `app.onError` and return JSON 500 rather than
  crashing; `uncaughtException` / `unhandledRejection` are logged instead of
  killing the process.
