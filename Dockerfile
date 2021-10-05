FROM node:alpine

# Create app directory
WORKDIR /usr/src/app

COPY dist node_modules package.json ./

EXPOSE 3000

CMD ["yarn", "start:prod"]
