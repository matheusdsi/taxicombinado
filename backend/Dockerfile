FROM node:18-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN ./node_modules/.bin/tsc

EXPOSE 3001

CMD ["node", "dist/server.js"]
