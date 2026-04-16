FROM node:22-slim AS frontend
WORKDIR /build/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY server.js ./
COPY --from=frontend /build/public ./public

ENV DB_PATH=/data/todos.db
VOLUME ["/data"]

EXPOSE 3000

CMD ["node", "server.js"]
