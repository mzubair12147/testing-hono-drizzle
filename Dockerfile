
FROM node:22-alpine3.20 AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY . .
RUN pnpm build

FROM node:22-alpine3.20 AS runner
WORKDIR /app
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

ENV PORT=3000
ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "--import=tsx/esm", "dist/index.js"]