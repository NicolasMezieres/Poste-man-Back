FROM node:22

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm i

COPY . .

RUN npx prisma generate && npm run build

EXPOSE 3000

CMD ["npx", "nest", "start", "--watch"]