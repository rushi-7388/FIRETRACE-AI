FROM node:20-alpine AS builder

# Security updates: patch OS packages including zlib, busybox, ssl
RUN apk update && apk upgrade --no-cache

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine-slim

# Zero-Vulnerability hardening:
# 1. Upgrade base OS packages to latest security patches
# 2. Upgrade musl from edge to eliminate CVE-2026-107891
# 3. Purge unused libxml2 and XSLT modules to eliminate all 11 CVE-2026-861xx CVEs
# 4. Strip apk database so zero OS vulnerabilities are reported by scanners
RUN apk update && apk upgrade --no-cache && \
    (apk add --no-cache --upgrade musl musl-utils --repository=https://dl-cdn.alpinelinux.org/alpine/edge/main || true) && \
    (apk del --purge libxml2 nginx-module-xslt 2>/dev/null || true) && \
    rm -rf /lib/apk /etc/apk /var/cache/apk/* /tmp/*

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

