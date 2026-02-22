FROM node:22-alpine AS base

RUN corepack enable && corepack prepare pnpm@10.6.3 --activate

WORKDIR /workspace

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* turbo.json tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN pnpm install --filter web...

WORKDIR /workspace/apps/web

EXPOSE 3000

CMD ["pnpm", "dev"]
