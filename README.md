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
  client. Talks to Postgres via Kysely.
- **Client** — Lit + Suunta router (`src/client`), built by Vite.
- **Database** — Postgres, so multiple crew machines can edit concurrently.

Three routes:

- `/` — transparent stream overlay (animated leaderboard, keys over video)
- `/admin` — score-entry console
- `/standings` — overall + per-category results

## Run with Docker (production, e.g. Hetzner)

```bash
docker compose up -d --build
```

Brings up Postgres + the app, runs migrations automatically, and serves
everything on port **3000**. Postgres is exposed on 5432 so other crew machines
on the network can point their own app instance at the same database.

## Local development

```bash
npm install
cp .env.example .env          # adjust DATABASE_URL if needed
# start Postgres however you like, e.g.:
docker compose up -d db
npm run migrate               # create tables + seed countries/categories
npm run dev                   # server on :3000, Vite client on :8000
```

Open http://localhost:8000. The Vite dev server proxies `/api` and `/ws` to the
server, so everything is same-origin.

## Notes

- Migrations are idempotent (`npm run migrate`); safe to run on every deploy.
- No auth — this is a private site on a trusted network, by design.
