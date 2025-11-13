FROM node:20-alpine
RUN apk add --no-cache openssl

EXPOSE 3000

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json* prisma/ ./

RUN npm ci --omit=dev && npm cache clean --force
RUN npm remove @shopify/cli || true
RUN npm install -g rimraf

COPY . .

RUN npm run build

CMD ["npm", "run", "docker-start"]
