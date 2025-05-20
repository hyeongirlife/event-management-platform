FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY yarn.lock ./
COPY . .
WORKDIR /app/apps/event-server
RUN yarn install --frozen-lockfile
RUN yarn build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/apps/event-server/node_modules ./node_modules
COPY --from=builder /app/apps/event-server/dist ./dist
COPY --from=builder /app/apps/event-server/.env.docker .env
EXPOSE 3002
CMD ["node", "dist/main.js"]