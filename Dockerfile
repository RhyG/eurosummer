# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
WORKDIR /app

# Install root + workspace deps
FROM base AS deps
COPY package.json package-lock.json* ./
COPY client/package.json client/
COPY server/package.json server/
RUN npm install

# Build client
FROM deps AS build-client
COPY client client
RUN npm run build --workspace=client

# Build server
FROM deps AS build-server
COPY server server
RUN npm run build --workspace=server

# Production image
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build-server /app/server/dist ./server/dist
COPY --from=build-server /app/server/package.json ./server/package.json
COPY --from=build-client /app/client/dist ./client/dist
COPY package.json ./

EXPOSE 8080
CMD ["node", "server/dist/index.js"]
