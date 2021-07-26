FROM node:alpine

# Create app directory
WORKDIR /usr/src/app

VOLUME /usr/src/app/config

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install && npm run build

COPY . .

CMD ["npm", "run", "start:prod"]
