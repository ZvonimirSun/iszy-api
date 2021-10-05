FROM node:alpine

# Create app directory
WORKDIR /usr/src/app

COPY dist node_modules package.json ./

CMD ["yarn", "start:prod"]
