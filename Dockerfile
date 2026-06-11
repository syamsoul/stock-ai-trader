FROM node:24

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run prisma:generate

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
