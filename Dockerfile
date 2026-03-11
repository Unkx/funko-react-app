FROM node:20-alpine as builder
WORKDIR /app
COPY package*.json ./

# Dodajemy czyszczenie cache npm dla pewności
RUN npm cache clean --force && \
    rm -rf node_modules package-lock.json && \
    npm install

COPY . .
RUN npm run build

FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Instaluj gettext do envsubst
RUN apk add --no-cache gettext

# Kopiuj plik konfiguracyjny jako szablon
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf.template

# Skrypt startowy, który podmieni zmienne
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'export BACKEND_HOST=${BACKEND_HOST:-backend}' >> /docker-entrypoint.sh && \
    echo 'export BACKEND_PORT=${BACKEND_PORT:-5000}' >> /docker-entrypoint.sh && \
    echo 'export BACKEND_PROTOCOL=${BACKEND_PROTOCOL:-http}' >> /docker-entrypoint.sh && \
    echo 'envsubst "$$BACKEND_HOST $$BACKEND_PORT $$BACKEND_PROTOCOL" < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf' >> /docker-entrypoint.sh && \
    echo 'cat /etc/nginx/conf.d/default.conf' >> /docker-entrypoint.sh && \
    echo 'exec nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]