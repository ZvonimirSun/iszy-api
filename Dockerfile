FROM node:alpine

# Create app directory
WORKDIR /usr/src/app

COPY . ./

EXPOSE 3000

CMD ["yarn", "start:prod"]
