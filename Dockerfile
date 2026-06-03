FROM node:26-alpine

WORKDIR /usr/src/app
COPY package*.json ./

# Copy the Prisma schema BEFORE npm install so the client can generate correctly
COPY prisma ./prisma/
RUN npm install --omit=dev
COPY . .

ENV NODE_ENV=production
CMD [ "sh", "-c", "npx prisma migrate deploy && node index.js" ]