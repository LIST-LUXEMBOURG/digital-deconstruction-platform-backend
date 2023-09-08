FROM node:fermium-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install glob rimraf

RUN npm install --only=development

COPY . .

RUN npm run build

FROM node:fermium-alpine as production

ARG NODE_ENV=production
ARG BUILD

ENV NODE_ENV=${NODE_ENV}
ENV BUILD=$BUILD

RUN apk add bash

WORKDIR /usr/src/app

RUN mkdir -p /var/data/file-system && chown -R node:node /var/data/file-system

COPY package*.json ./

RUN npm install --only=production

COPY . . 

RUN chmod +x ./wait-for-it.sh

COPY --from=build /usr/src/app/dist ./dist

COPY ormconfig.json /usr/src/app/ormconfig.json

EXPOSE 3000
EXPOSE 4000
EXPOSE 4100

CMD ["node", "dist/main"]