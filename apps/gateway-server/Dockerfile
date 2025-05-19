FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY yarn.lock ./
COPY . .
WORKDIR /app/apps/gateway-server
RUN yarn install --frozen-lockfile
RUN yarn build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/apps/gateway-server/node_modules ./node_modules
COPY --from=builder /app/apps/gateway-server/dist ./dist
COPY --from=builder /app/apps/gateway-server/.env.docker .env
EXPOSE 3000
CMD ["node", "dist/main.js"]