import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { createNodeWebSocket } from "@hono/node-ws";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import type { WSContext } from "hono/ws";
import { existsSync, readFileSync } from "fs";
import { db } from "./db.js";
import { getCategoryStandings, getOverallStandings } from "./scoring.js";
import { POINT_LADDER, type Vote } from "../shared/types.js";

const app = new Hono();
app.use("/api/*", cors());

// Never let a thrown handler take the process down — log and return JSON 500.
app.onError((err, c) => {
    if (err instanceof HTTPException) {
        return err.getResponse();
    }
    console.error("[api error]", err);
    return c.json({ error: "internal_error" }, 500);
});

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

const sockets = new Set<WSContext<WebSocket>>();

function broadcastUpdate() {
    for (const socket of sockets) {
        try {
            socket.send("UPDATE");
        } catch {
            sockets.delete(socket);
        }
    }
}

app.get(
    "/ws",
    upgradeWebSocket(() => ({
        onOpen(_evt, ws) {
            sockets.add(ws);
        },
        onClose(_evt, ws) {
            sockets.delete(ws);
        },
        onError(_evt, ws) {
            sockets.delete(ws);
        },
    })),
);

// --- Reference data ---------------------------------------------------------

app.get("/api/bootstrap", async (c) => {
    const countries = await db
        .selectFrom("country")
        .select(["id", "name", "flag_img", "sort_order"])
        .orderBy("sort_order")
        .execute();
    const categories = await db
        .selectFrom("category")
        .select(["id", "name", "focus", "sort_order"])
        .orderBy("sort_order")
        .execute();

    return c.json({
        countries: countries.map((r) => ({
            id: r.id,
            name: r.name,
            flagImg: r.flag_img,
            sortOrder: r.sort_order,
        })),
        categories: categories.map((r) => ({
            id: r.id,
            name: r.name,
            focus: r.focus,
            sortOrder: r.sort_order,
        })),
        ladder: POINT_LADDER,
    });
});

// --- Votes (admin) ----------------------------------------------------------

app.get("/api/votes", async (c) => {
    const rows = await db
        .selectFrom("vote")
        .select(["from_country_id", "category_id", "to_country_id", "points", "revealed"])
        .execute();
    const votes: Vote[] = rows.map((r) => ({
        fromCountryId: r.from_country_id,
        categoryId: r.category_id,
        toCountryId: r.to_country_id,
        points: r.points,
        revealed: r.revealed === 1,
    }));
    return c.json({ votes });
});

// Save the points for one ballot (a from-country's votes in one category).
// Does not change reveal state.
app.post("/api/ballot", async (c) => {
    const body = await c.req.json<{
        fromCountryId: number;
        categoryId: number;
        votes: { toCountryId: number; points: number }[];
    }>();

    await db.transaction().execute(async (trx) => {
        for (const v of body.votes) {
            await trx
                .updateTable("vote")
                .set({ points: v.points })
                .where("from_country_id", "=", body.fromCountryId)
                .where("category_id", "=", body.categoryId)
                .where("to_country_id", "=", v.toCountryId)
                .execute();
        }
    });

    return c.json({ ok: true });
});

// Reveal (or hide) a whole ballot on the overlay.
app.post("/api/ballot/reveal", async (c) => {
    const body = await c.req.json<{
        fromCountryId: number;
        categoryId: number;
        revealed: boolean;
    }>();

    await db
        .updateTable("vote")
        .set({ revealed: body.revealed ? 1 : 0 })
        .where("from_country_id", "=", body.fromCountryId)
        .where("category_id", "=", body.categoryId)
        .execute();

    broadcastUpdate();
    return c.json({ ok: true });
});

// --- Standings --------------------------------------------------------------

app.get("/api/overlay", async (c) => {
    const standings = await getOverallStandings();
    return c.json({ standings });
});

app.get("/api/standings", async (c) => {
    const [overall, categories] = await Promise.all([
        getOverallStandings(),
        getCategoryStandings(),
    ]);
    return c.json({ overall, categories });
});

// --- Static client (production) ---------------------------------------------

const CLIENT_DIR = "./dist/client";
if (existsSync(CLIENT_DIR)) {
    app.use("/*", serveStatic({ root: CLIENT_DIR }));
    // SPA fallback: any non-API route serves index.html so the client router
    // can handle /admin and /standings on a hard refresh.
    const indexHtml = readFileSync(`${CLIENT_DIR}/index.html`, "utf8");
    app.get("*", (c) => c.html(indexHtml));
}

const PORT = Number(process.env.PORT ?? 3000);
const server = serve({ fetch: app.fetch, port: PORT }, (info) => {
    console.log(`Server running on http://localhost:${info.port}`);
});

injectWebSocket(server);

// Last-resort safety nets so a stray throw in an async callback or a broken
// WS frame can't kill the whole server mid-competition. Log loudly and keep
// running — the request that caused it is already lost, but the process isn't.
process.on("uncaughtException", (err) => {
    console.error("[uncaughtException]", err);
});
process.on("unhandledRejection", (reason) => {
    console.error("[unhandledRejection]", reason);
});
