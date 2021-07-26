FROM node:alpine

# Create app directory
WORKDIR /usr/src/app

VOLUME /usr/src/app/config

COPY . .

RUN yarn && yarn build

CMD ["yarn", "start:prod"]
