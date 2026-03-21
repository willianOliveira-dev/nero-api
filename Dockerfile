FROM node:24-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@10.30.3 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

FROM base AS deps

RUN pnpm install --frozen-lockfile

FROM deps AS build

COPY . .

RUN pnpm run build

FROM base AS production

ENV NODE_ENV=production

RUN pnpm install --frozen-lockfile --prod --ignore-scripts

COPY --from=build /app/dist ./dist

EXPOSE 8000

CMD ["node", "dist/server.js"]
