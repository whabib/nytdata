FROM node:26-alpine

# Install OpenSSL, which is required by Prisma's query engine on Alpine
RUN apk add --no-cache openssl

WORKDIR /usr/src/app
COPY package*.json ./

# Copy the Prisma schema BEFORE npm install so the client can generate correctly
COPY prisma ./prisma/

# Install ALL dependencies (including dev) so the Prisma CLI is available
RUN npm install

# Explicitly generate the Prisma client for the Alpine/Linux environment
RUN npx prisma generate

# Prune dev dependencies now that the client is generated to save space
RUN npm prune --omit=dev

COPY . .

ENV NODE_ENV=production
CMD [ "sh", "-c", "npx prisma migrate deploy && node index.js" ]