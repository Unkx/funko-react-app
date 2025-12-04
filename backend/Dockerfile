FROM node:18-alpine
WORKDIR /usr/src/app

# Install production dependencies
COPY backend/package.json backend/package-lock.json* ./
RUN npm install --production --legacy-peer-deps

# Copy backend source
COPY backend/ .

ENV PORT=5000
EXPOSE 5000

CMD ["node", "server.js"]
