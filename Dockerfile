# =============================================================================
# Dockerfile - Ứng dụng Node.js (Express/NestJS...)
# Multi-stage: build -> runtime (image nhỏ, chạy bằng user không phải root)
# Build:  docker build -t myapp:latest .
# =============================================================================

# ---------- Stage 1: cài dependency + build ----------
FROM node:20-alpine AS build
WORKDIR /app

# Copy package trước để tận dụng cache layer khi code đổi nhưng dependency không đổi
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .
# Chỉ chạy nếu package.json có script "build" (NestJS/TypeScript). Express thuần sẽ bỏ qua.
RUN npm run build --if-present
# Bỏ devDependencies để image nhẹ hơn
RUN npm prune --omit=dev

# ---------- Stage 2: runtime ----------
FROM node:20-alpine AS runtime
ENV NODE_ENV=production \
    PORT=8000 \
    HEALTH_PATH=/health
WORKDIR /app

COPY --from=build --chown=node:node /app /app

# Không chạy bằng root
USER node

# Cổng app lắng nghe BÊN TRONG container (khớp PORT)
EXPOSE 8000

# Docker tự kiểm tra app còn sống (Node 20 có sẵn fetch, không cần cài curl)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+process.env.HEALTH_PATH).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npm", "start"]
