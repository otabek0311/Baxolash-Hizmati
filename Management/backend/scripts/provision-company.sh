#!/bin/bash
set -euo pipefail

# ================================================================
# provision-company.sh
# Yangi korxona uchun Docker Compose stack yaratadi.
#
# Ishlatish:
#   ./provision-company.sh <slug> <frontend_port> <backend_port> \
#       <db_port> <db_name> <db_user> <db_password> [domain]
#
# Misol:
#   ./provision-company.sh acme 3100 4100 5532 acme_db acme_user S3cr3t!
# ================================================================

# -----------------------------------------------
# Argumentlarni tekshirish
# -----------------------------------------------
if [ $# -lt 7 ]; then
  echo "XATO: Yetarli argument berilmadi." >&2
  echo "Ishlatish: $0 <slug> <frontend_port> <backend_port> <db_port> <db_name> <db_user> <db_password> [domain]" >&2
  exit 1
fi

SLUG="$1"
FRONTEND_PORT="$2"
BACKEND_PORT="$3"
DB_PORT="$4"
DB_NAME="$5"
DB_USER="$6"
DB_PASSWORD="$7"
DOMAIN="${8:-"$SLUG.qrhujjat.uz"}"

COMPANY_DIR="/opt/qrhujjat/companies/$SLUG"
QRHUJJAT_SOURCE="/opt/qrhujjat/source"

# -----------------------------------------------
# Slug validatsiyasi (faqat kichik harf, raqam, defis)
# -----------------------------------------------
if ! echo "$SLUG" | grep -qE '^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$'; then
  echo "XATO: slug faqat kichik harf, raqam va defisdan iborat bo'lishi kerak (3-32 belgi)." >&2
  exit 1
fi

# -----------------------------------------------
# Port band emasligini tekshirish
# -----------------------------------------------
check_port() {
  local port=$1
  if ss -tuln 2>/dev/null | grep -q ":${port} " || \
     netstat -tuln 2>/dev/null | grep -q ":${port} "; then
    echo "XATO: Port $port allaqachon band." >&2
    exit 1
  fi
}
check_port "$FRONTEND_PORT"
check_port "$BACKEND_PORT"
check_port "$DB_PORT"

# -----------------------------------------------
# Manba kodni tekshirish
# -----------------------------------------------
if [ ! -d "$QRHUJJAT_SOURCE/Frontend" ] || [ ! -d "$QRHUJJAT_SOURCE/Backend" ]; then
  echo "XATO: $QRHUJJAT_SOURCE ichida Frontend yoki Backend topilmadi." >&2
  echo "      Avval setup-server.sh ni ishga tushiring va manba kodni ko'chiring." >&2
  exit 1
fi

# -----------------------------------------------
# Korxona allaqachon mavjudligini tekshirish
# -----------------------------------------------
if [ -d "$COMPANY_DIR" ]; then
  echo "XATO: $SLUG korxonasi allaqachon mavjud: $COMPANY_DIR" >&2
  exit 1
fi

echo "=== $SLUG korxonasi yaratilmoqda ==="
echo "  Domain      : $DOMAIN"
echo "  Frontend    : localhost:$FRONTEND_PORT"
echo "  Backend API : localhost:$BACKEND_PORT"
echo "  PostgreSQL  : localhost:$DB_PORT"

# -----------------------------------------------
# 1. Katalog yaratish
# -----------------------------------------------
echo "[1/10] Katalog yaratilmoqda..."
mkdir -p "$COMPANY_DIR"

# -----------------------------------------------
# 2. Manba kodni nusxalash
# -----------------------------------------------
echo "[2/10] Manba kod nusxalanmoqda..."
cp -r "$QRHUJJAT_SOURCE/Frontend" "$COMPANY_DIR/frontend"
cp -r "$QRHUJJAT_SOURCE/Backend"  "$COMPANY_DIR/backend"

# node_modules ni o'chirish (yangi o'rnatish uchun)
rm -rf "$COMPANY_DIR/frontend/node_modules" \
       "$COMPANY_DIR/backend/node_modules" \
       "$COMPANY_DIR/frontend/dist" \
       "$COMPANY_DIR/backend/dist"

# -----------------------------------------------
# 3. .env fayllarini yaratish
# -----------------------------------------------
echo "[3/10] .env fayllar yaratilmoqda..."
JWT_SECRET=$(openssl rand -hex 32)

cat > "$COMPANY_DIR/backend/.env" << EOF
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}
JWT_SECRET=${JWT_SECRET}
PORT=5000
NODE_ENV=production
BASE_URL=https://${DOMAIN}
CORS_ORIGIN=https://${DOMAIN}
EOF

cat > "$COMPANY_DIR/frontend/.env.local" << EOF
VITE_API_URL=https://${DOMAIN}/api
EOF

chmod 600 "$COMPANY_DIR/backend/.env"

# -----------------------------------------------
# 4. docker-compose.yml yaratish
# -----------------------------------------------
echo "[4/10] docker-compose.yml yaratilmoqda..."
cat > "$COMPANY_DIR/docker-compose.yml" << EOF
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "${FRONTEND_PORT}:4173"
    environment:
      - VITE_API_URL=https://${DOMAIN}/api
    depends_on:
      - backend
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "${BACKEND_PORT}:5000"
    env_file:
      - ./backend/.env
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  db:
    image: postgres:16-alpine
    ports:
      - "${DB_PORT}:5432"
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 10s
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

volumes:
  pgdata:
    name: ${SLUG}_pgdata
EOF

# -----------------------------------------------
# 5. Frontend Dockerfile
# -----------------------------------------------
echo "[5/10] Frontend Dockerfile yaratilmoqda..."
cat > "$COMPANY_DIR/frontend/Dockerfile" << 'DOCKERFILE'
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
RUN npm install -g vite serve
EXPOSE 4173
CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "4173"]
DOCKERFILE

# -----------------------------------------------
# 6. Backend Dockerfile
# -----------------------------------------------
echo "[6/10] Backend Dockerfile yaratilmoqda..."
cat > "$COMPANY_DIR/backend/Dockerfile" << 'DOCKERFILE'
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build 2>/dev/null || true

FROM node:20-alpine AS runner
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
EXPOSE 5000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
DOCKERFILE

# -----------------------------------------------
# 7. Konteynerlarni ishga tushirish
# -----------------------------------------------
echo "[7/10] Docker Compose ishga tushirilmoqda..."
cd "$COMPANY_DIR"
docker-compose up -d --build

# -----------------------------------------------
# 8. DB tayyor bo'lishini kutish
# -----------------------------------------------
echo "[8/10] Ma'lumotlar bazasi tayyor bo'lishini kutmoqda..."
MAX_WAIT=60
WAITED=0
until docker-compose exec -T db pg_isready -U "$DB_USER" -d "$DB_NAME" &>/dev/null; do
  if [ $WAITED -ge $MAX_WAIT ]; then
    echo "XATO: DB $MAX_WAIT soniya ichida tayyor bo'lmadi." >&2
    docker-compose logs db >&2
    exit 1
  fi
  echo "  DB kutilmoqda... (${WAITED}s)"
  sleep 3
  WAITED=$((WAITED + 3))
done
echo "  DB tayyor!"

# -----------------------------------------------
# 9. Migratsiya va seed
# -----------------------------------------------
echo "[9/10] Migratsiya va seed..."
docker-compose exec -T backend npx prisma migrate deploy || {
  echo "OGOHLANTIRISH: Migratsiya amalga oshmadi. Loglarni tekshiring:" >&2
  docker-compose logs backend >&2
}

# Seed faylini tekshirib ishga tushirish
if docker-compose exec -T backend test -f prisma/seed.ts 2>/dev/null || \
   docker-compose exec -T backend test -f prisma/seed.js 2>/dev/null; then
  docker-compose exec -T backend npx ts-node prisma/seed.ts 2>/dev/null || \
  docker-compose exec -T backend node prisma/seed.js 2>/dev/null || \
  echo "OGOHLANTIRISH: Seed amalga oshmadi (ixtiyoriy)."
fi

# -----------------------------------------------
# 10. Nginx konfiguratsiya
# -----------------------------------------------
echo "[10/10] Nginx sozlanmoqda..."
NGINX_CONF="/etc/nginx/sites-available/$SLUG"

cat > "$NGINX_CONF" << EOF
# $SLUG - $(date '+%Y-%m-%d %H:%M:%S') da yaratilgan
server {
    listen 80;
    server_name ${DOMAIN};

    # Frontend
    location / {
        proxy_pass http://localhost:${FRONTEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 60s;
        client_max_body_size 50m;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:${BACKEND_PORT}/health;
        access_log off;
    }
}
EOF

ln -sf "$NGINX_CONF" "/etc/nginx/sites-enabled/$SLUG"

if nginx -t; then
  systemctl reload nginx
  echo "  Nginx muvaffaqiyatli qayta yuklandi."
else
  echo "XATO: Nginx konfiguratsiya xatosi. Tekshiring: nginx -t" >&2
  exit 1
fi

# -----------------------------------------------
# Yakuniy hisobot
# -----------------------------------------------
echo ""
echo "=================================================="
echo "  $SLUG korxonasi MUVAFFAQIYATLI yaratildi!"
echo "=================================================="
echo ""
echo "  Frontend    : http://${DOMAIN}"
echo "  Backend API : http://${DOMAIN}/api"
echo "  DB Port     : ${DB_PORT} (faqat ichki)"
echo ""
echo "  Katalog     : $COMPANY_DIR"
echo ""
echo "Foydali buyruqlar:"
echo "  Loglar      : cd $COMPANY_DIR && docker-compose logs -f"
echo "  To'xtatish  : /opt/qrhujjat/scripts/suspend-company.sh $SLUG"
echo "  O'chirish   : /opt/qrhujjat/scripts/remove-company.sh $SLUG"
echo ""
echo "SSL sertifikat olish (ixtiyoriy):"
echo "  certbot --nginx -d ${DOMAIN}"
