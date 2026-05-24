FROM node:24-bookworm-slim

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV NODE_OPTIONS="--use-system-ca --use-env-proxy"

USER root
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json ./
# GitHub Actions builds the app and prunes dev dependencies before docker build.
COPY node_modules ./node_modules
COPY dist ./dist

USER node

EXPOSE 3000

CMD ["node", "dist/main"]
