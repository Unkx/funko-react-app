FROM node:18-alpine

WORKDIR /app

# Copy package files (no "backend/" prefix since context is already ./backend)
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code (no "backend/" prefix)
COPY . .

ENV PORT=5000

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]