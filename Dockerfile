FROM node

# Create app directory
WORKDIR /usr/src/app

COPY package.json ./
COPY node_modules ./node_modules
COPY dist ./dist

EXPOSE 3000

CMD ["node", "dist/src/main"]
