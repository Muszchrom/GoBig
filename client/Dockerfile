FROM node:18.17.1-alpine as base
WORKDIR /code
COPY package.json package.json
COPY package-lock.json package-lock.json

FROM base as dev
RUN npm ci
COPY . .
CMD ["npm", "start"]
