FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV DATA_DIR=/app/data
ENV UPLOAD_DIR=/app/uploads
ENV DIST_DIR=/app/dist

COPY server/package*.json ./
RUN npm ci --production

COPY --from=builder /app/dist ./dist
COPY server/server.js ./

RUN mkdir -p /app/data /app/uploads

VOLUME ["/app/data", "/app/uploads"]

EXPOSE 3001

CMD ["node", "server.js"]
