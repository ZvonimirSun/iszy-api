FROM node:alpine

# Create app directory
WORKDIR /usr/src/app

VOLUME /usr/src/app/config

COPY . .

RUN npm install && npm run build

COPY . .

CMD ["npm", "run", "start:prod"]
