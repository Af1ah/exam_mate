FROM oven/bun:1.4.0 AS dependencies

WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM oven/bun:1.4.0 AS build

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN bun run build

FROM node:24-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8096
ENV HOSTNAME=0.0.0.0

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/migrations ./migrations
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/scripts/check-migration-safety.mjs ./scripts/check-migration-safety.mjs
COPY --from=build /app/docker/entrypoint.sh ./docker/entrypoint.sh
COPY --from=build /app/docker/migrate.sh ./docker/migrate.sh

RUN chmod 0555 ./docker/entrypoint.sh ./docker/migrate.sh
EXPOSE 8096
ENTRYPOINT ["./docker/entrypoint.sh"]
