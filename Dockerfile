# ============================================
# STAGE 1: Build Frontend (React + Vite)
# ============================================
FROM node:18-alpine AS frontend-build

ARG FRONTEND_REPO=https://github.com/MaycolMont/leopet-fronted-web-main.git

WORKDIR /frontend

RUN apk add --no-cache git && \
    git clone --depth 1 ${FRONTEND_REPO} . && \
    npm ci && \
    npm run build

# ============================================
# STAGE 2: Backend + Frontend estático
# ============================================
FROM node:20-alpine

LABEL maintainer="LEOPET Team"
LABEL description="LEOPET - Plataforma de apadrinamiento de animales"

WORKDIR /app

# Copiar dependencias del backend
COPY package*.json ./
RUN npm ci --omit=dev

# Copiar código del backend
COPY . .

# Copiar frontend compilado desde stage 1
COPY --from=frontend-build /frontend/dist ./public

# Crear directorios necesarios
RUN mkdir -p tempFiles uploads

EXPOSE 8181

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8181/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "server.js"]
