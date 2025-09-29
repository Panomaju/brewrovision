import { serve } from "@hono/node-server";
import { createNodeWebSocket } from "@hono/node-ws";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { WSContext } from "hono/ws";

const app = new Hono();
app.use("*", cors());

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

const sockets: WSContext<WebSocket>[] = [];

const COUNTRIES: Country[] = [
  {
    id: 1,
    name: "Finland",
    flag: "https://www.countryflags.com/wp-content/uploads/finland-flag-png-large.png",
  },
  {
    id: 2,
    name: "Scotland",
    flag: "https://www.countryflags.com/wp-content/uploads/scotland-flag-jpg-xl.jpg",
  },
  {
    id: 3,
    name: "England",
    flag: "https://www.countryflags.com/wp-content/uploads/england-flag-jpg-xl.jpg",
  },
  {
    id: 4,
    name: "Ireland",
    flag: "https://www.countryflags.com/wp-content/uploads/ireland-flag-png-large.png",
  },
  {
    id: 5,
    name: "Poland",
    flag: "https://www.countryflags.com/wp-content/uploads/poland-flag-png-large.png",
  },
];

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

const DATA_FILE_PATH = "./panomaju-data.json";

app.get("/", (c) => {
  return c.json({
    message: "Please fetch through one of the listed api:s",
    getData: SERVER_URL + "/get-data",
    updateData: SERVER_URL + "/update-data",
  });
});

app.get("/get-data", (c) => {
  const participantData = readData(DATA_FILE_PATH);
  return c.json({
    participantData,
  });
});

function getScoresForCountry(country: Country, participantData: any) {
  return participantData.participants.reduce((acc: number, part: any) => {
    Object.values(part.scores as CategoryScores[][]).forEach(
      (categoryScoreArrays) => {
        categoryScoreArrays.forEach((categoryScores) => {
          if (categoryScores.countryId != country.id) {
            return;
          }
          if (categoryScores.score > 0) {
            console.log("Adding score " + categoryScores.score);
          }
          acc += categoryScores.score;
        });
      },
    );
    return acc;
  }, 0);
}

app.get("/get-score-data", (c) => {
  const participantData = readData(DATA_FILE_PATH);
  const participants = COUNTRIES.map((country) => ({
    ...country,
    score: getScoresForCountry(country, participantData),
  }));
  return c.json({
    participantData: {
      participants,
    },
  });
});

app.post("/update-participant-data", async (c) => {
  let data = await c.req.json();

  writeData(DATA_FILE_PATH, data);

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

interface Country {
  id: number;
  name: string;
  flag: string;
}

interface CategoryScores {
  countryId: number;
  score: number;
}

function checkForDataFile() {
  if (existsSync(DATA_FILE_PATH)) {
    return;
  }

  function createScoreObject(country: Country): CategoryScores[] {
    return COUNTRIES.filter((c) => c.id !== country.id).map((c) => ({
      countryId: c.id,
      score: 0,
      published: false,
    }));
  }

  const BASE = {
    participants: COUNTRIES.map((country) => ({
      country,
      scores: {
        "Pale Lager": createScoreObject(country),
        "Pale Belgian": createScoreObject(country),
        IPA: createScoreObject(country),
        "Dark Strong": createScoreObject(country),
        "Sour Beer": createScoreObject(country),
      },
    })),
  };

  writeFileSync(DATA_FILE_PATH, JSON.stringify(BASE, null, 4), "utf8");

  console.log("Created initial data file");
}

checkForDataFile();

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
