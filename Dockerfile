FROM node:22

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm i

COPY . .

RUN npm run build && npx prisma generate

EXPOSE 3000

CMD ["npx", "nest", "start", "--watch"]