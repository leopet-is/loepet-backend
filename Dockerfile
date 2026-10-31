FROM node:22-alpine

LABEL maintainer="LEOPET Team"
LABEL description="LEOPET - Plataforma de apadrinamiento de animales"

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

RUN mkdir -p tempFiles uploads

ENV NODE_ENV=production
ENV PORT=8181

EXPOSE 8181

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:'+(process.env.PORT||8181)+'/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "server.js"]
