FROM node:14.18.0-alpine as base
WORKDIR /code
COPY package.json package.json
COPY package-lock.json package-lock.json

FROM base as dev
RUN npm ci
COPY . .
CMD ["npm", "start"]

# build will be managed by github actions

FROM nginx:latest as serve
COPY build /usr/share/nginx/html
COPY nginx/config/ /etc/nginx/conf.d/