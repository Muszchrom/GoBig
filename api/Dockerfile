FROM node:18-alpine as base
WORKDIR /code
COPY package.json package.json
COPY package-lock.json package-lock.json

FROM base as dev
RUN npm ci
COPY . .
CMD ["npm", "run", "dev"]

FROM base as prod
RUN npm ci --production
COPY . .
CMD ["npm", "run", "build"]
CMD ["node", "dist/index.js"]