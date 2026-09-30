# Single-image build: Vite builds the client, the server runs via tsx and
# serves the built client + API + websocket from one process.
FROM node:22-slim

WORKDIR /app

# python3 + build-essential are only needed if better-sqlite3 has to compile
# from source (i.e. no prebuilt binary matches the platform). Cheap insurance.
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# Build the client bundle into dist/client
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/data/brewrovision.db
EXPOSE 3000

# Run migrations (idempotent) then start the server.
CMD ["sh", "-c", "npm run migrate && npm run start"]
