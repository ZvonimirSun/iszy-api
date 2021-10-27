FROM node:alpine

# Create app directory
WORKDIR /usr/src/app

COPY package.json ./
COPY node_modules ./node_modules
COPY dist ./dist

EXPOSE 3000

CMD ["yarn", "start:prod"]
