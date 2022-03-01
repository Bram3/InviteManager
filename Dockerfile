FROM node:17.6

WORKDIR /usr/src/bot

COPY package*.json ./

RUN rm -rf node_modules && yarn install --frozen-lockfile
RUN yarn global add typescript

COPY . .

RUN npm run build

CMD ["node", "--experimental-specifier-resolution=node", "./build/index.js"]


