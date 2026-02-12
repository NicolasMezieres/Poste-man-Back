FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm i

COPY . .

RUN npx prisma generate && npm run build

COPY ./src/prisma/generated dist/src/prisma/generated

EXPOSE 3000

CMD ["npm", "run", "start:dev"]