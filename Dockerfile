FROM node:alpine as builder

# Create app directory
WORKDIR /usr/src/app

COPY . .

RUN yarn && yarn build

FROM node:alpine

# Create app directory
WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/dist /usr/src/app/node_modules /usr/src/app/package.json ./

CMD ["yarn", "start:prod"]
