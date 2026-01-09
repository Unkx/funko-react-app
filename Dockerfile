## Multi-stage build: build with node, serve with nginx (smaller runtime image)
## Use Node 20 to match newer package engine requirements (cypress, react-router, etc.)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
## Improve npm resilience in flaky network environments:
## - increase fetch retries and timeouts
## - disable audit during CI to avoid extra network requests
## - use unsafe-perm to avoid permission issues when running as root in alpine
RUN npm config set fetch-retries 5 \
 && npm config set fetch-retry-factor 10 \
 && npm config set fetch-retry-maxtimeout 60000 \
 && npm config set registry https://registry.npmjs.org/ \
 && npm ci --legacy-peer-deps --no-audit --unsafe-perm
COPY . .
ENV NODE_ENV=production
RUN npm run build

FROM nginx:stable-alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
