
# Stage 1: Install dependencies
FROM node:22-alpine AS dependencies

WORKDIR /app

COPY app/package*.json ./

RUN npm ci --omit=dev

# Stage 2: Production
FROM node:22-alpine AS production

ENV NODE_ENV=production

WORKDIR /app

# Remove npm from production runtime
USER root
RUN rm -rf /usr/local/lib/node_modules/npm \
    /usr/local/bin/npm \
    /usr/local/bin/npx

# Copy production dependencies
COPY --from=dependencies --chown=node:node /app/node_modules ./node_modules

# Copy application files
COPY --chown=node:node app/package.json ./
COPY --chown=node:node app/src ./src

EXPOSE 8000

USER node

CMD ["node", "src/server.js"]
