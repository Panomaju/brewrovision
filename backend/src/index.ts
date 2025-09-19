import { serve } from "@hono/node-server";
import { createNodeWebSocket } from "@hono/node-ws";
import { readFileSync, writeFileSync } from "fs";
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { WSContext } from "hono/ws";

const app = new Hono();
app.use("*", cors());

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

const sockets: WSContext<WebSocket>[] = [];

app.get(
  "/ws",
  upgradeWebSocket((c) => {
    return {
      onOpen(evt, ws) {
        sockets.push(ws);
      },
      onMessage(event, ws) {
        console.log(`Message from client: ${event.data}`);
        ws.send("Hello from server!");
      },
      onClose: (ev, ws) => {
        console.log("Connection closed");
      },
    };
  }),
);

function broadcastUpdate() {
  for (const socket of sockets) {
    socket.send("UPDATE");
  }
}

const args = process.argv;
const envArg = args.find((arg) => arg.startsWith("--env"));
const IS_PROD = envArg && envArg.replace("--env=", "") === "prod";

const SERVER_URL = IS_PROD
  ? "https://panomaju-api.matsu.beer"
  : "http://localhost:3000";

const SCORE_FILE_PATH = "./panomaju-data.json";
const PARTICIPANT_FILE_PATH = "./panomaju-data.json";

app.get("/", (c) => {
  return c.json({
    message: "Please fetch through one of the listed api:s",
    getData: SERVER_URL + "/get-data",
    updateData: SERVER_URL + "/update-data",
  });
});

app.get("/get-data", (c) => {
  const participantData = readData(PARTICIPANT_FILE_PATH);
  return c.json({
    participantData,
  });
});

app.post("/update-participant-data", async (c) => {
  let data = await c.req.json();

  data = data.sort((a, b) => b.score - a.score);

  writeData(PARTICIPANT_FILE_PATH, data);

  broadcastUpdate();

  return c.json({});
});

function writeData(fileName: string, data: any) {
  writeFileSync(fileName, JSON.stringify(data), "utf8");
}

function readData(filePath: string) {
  const rawData = readFileSync(filePath, "utf8");
  try {
    return JSON.parse(rawData);
  } catch (ex) {
    return {};
  }
}

const server = serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);

injectWebSocket(server);
