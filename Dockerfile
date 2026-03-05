FROM node:lts

# Create app directory
WORKDIR /usr/src/app

COPY package.json ./
COPY node_modules ./node_modules
COPY dist ./dist

ENV NODE_OPTIONS="--use-system-ca --use-env-proxy"

EXPOSE 3000

CMD ["node", "dist/main"]
