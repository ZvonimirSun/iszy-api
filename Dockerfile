FROM node:alpine

# Create app directory
WORKDIR /usr/src/app

COPY dockerPackages package.json ./

EXPOSE 3000

CMD ["yarn", "start:prod"]
