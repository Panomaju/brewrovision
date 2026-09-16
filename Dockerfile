# Single-image build: Vite builds the client, the server runs via tsx and
# serves the built client + API + websocket from one process.
FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# Build the client bundle into dist/client
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Run migrations (idempotent) then start the server.
CMD ["sh", "-c", "npm run migrate && npm run start"]
