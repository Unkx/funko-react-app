FROM node:20-alpine
WORKDIR /backend
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]  # ← Just run server.js, not init-db.js