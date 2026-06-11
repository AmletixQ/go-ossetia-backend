FROM node:22-alpine AS builder

WORKDIR /app

ARG POSTGRES_USER
ARG POSTGRES_PASSWORD
ARG POSTGRES_DB
ARG POSTGRES_HOST
ARG POSTGRES_PORT

ENV POSTGRES_USER=${POSTGRES_USER}
ENV POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
ENV POSTGRES_DB=${POSTGRES_DB}
ENV POSTGRES_HOST=${POSTGRES_HOST}
ENV POSTGRES_PORT=${POSTGRES_PORT}

# Installing dependencies & building the application
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY prisma ./prisma
COPY prisma.config.ts ./
COPY tsconfig.json build.js ./
COPY src ./src

RUN pnpm prisma generate
RUN pnpm build

# Deploy built application & start built
FROM node:22-alpine AS runner

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile
RUN pnpm install --save-prod prisma

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

RUN mkdir -p /app/node_modules/.pnpm && \
    chown -R root:root /app/node_modules/.pnpm

RUN addgroup --system --gid 1001 prisma
RUN adduser --system --uid 1001 hono

USER root

EXPOSE 3000

ENV NODE_ENV=production
ENV POSTGRES_HOST=postgres

CMD ["sh", "-c", "npx prisma migrate deploy && su -s /bin/sh hono -c 'node dist/index.js'"]