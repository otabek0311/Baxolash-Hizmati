#!/bin/bash
set -euo pipefail

echo "=== QR Hujjat Tizimi - Server sozlash ==="

# Root tekshiruvi
if [ "$EUID" -ne 0 ]; then
  echo "XATO: Bu skriptni root yoki sudo bilan ishga tushiring." >&2
  exit 1
fi

# -----------------------------------------------
# 1. Tizimni yangilash
# -----------------------------------------------
echo "[1/9] Tizim yangilanmoqda..."
apt-get update -y
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y

# -----------------------------------------------
# 2. Docker o'rnatish
# -----------------------------------------------
echo "[2/9] Docker o'rnatilmoqda..."
apt-get install -y ca-certificates curl gnupg lsb-release

install -m 0755 -d /usr/share/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] \
  https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
  | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

systemctl enable docker
systemctl start docker

# -----------------------------------------------
# 3. docker-compose (standalone) o'rnatish
# -----------------------------------------------
echo "[3/9] docker-compose (standalone) o'rnatilmoqda..."
COMPOSE_VERSION=$(curl -fsSL https://api.github.com/repos/docker/compose/releases/latest \
  | grep '"tag_name"' | sed -E 's/.*"v([^"]+)".*/\1/')

curl -fsSL \
  "https://github.com/docker/compose/releases/download/v${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose

chmod +x /usr/local/bin/docker-compose
docker-compose --version

# -----------------------------------------------
# 4. Node.js 20 o'rnatish
# -----------------------------------------------
echo "[4/9] Node.js 20 o'rnatilmoqda..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node --version
npm --version

# PM2 (management backend uchun)
npm install -g pm2
pm2 startup systemd -u root --hp /root | tail -1 | bash || true

# -----------------------------------------------
# 5. Nginx o'rnatish
# -----------------------------------------------
echo "[5/9] Nginx o'rnatilmoqda..."
apt-get install -y nginx
systemctl enable nginx
systemctl start nginx

# Default site'ni o'chirish
rm -f /etc/nginx/sites-enabled/default

# -----------------------------------------------
# 6. Certbot (SSL) o'rnatish
# -----------------------------------------------
echo "[6/9] Certbot o'rnatilmoqda..."
apt-get install -y certbot python3-certbot-nginx

# -----------------------------------------------
# 7. Katalog tuzilmasini yaratish
# -----------------------------------------------
echo "[7/9] Katalog tuzilmasi yaratilmoqda..."
mkdir -p /opt/qrhujjat/companies
mkdir -p /opt/qrhujjat/management
mkdir -p /opt/qrhujjat/source
mkdir -p /opt/qrhujjat/scripts

# Skriptlarni nusxalash (agar mavjud bo'lsa)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cp "$SCRIPT_DIR"/*.sh /opt/qrhujjat/scripts/ 2>/dev/null || true
chmod +x /opt/qrhujjat/scripts/*.sh 2>/dev/null || true

echo "Kataloglar yaratildi:"
echo "  /opt/qrhujjat/companies  — har bir korxona uchun"
echo "  /opt/qrhujjat/management — management panel"
echo "  /opt/qrhujjat/source     — manba kod (Frontend + Backend)"
echo "  /opt/qrhujjat/scripts    — boshqaruv skriptlari"

# -----------------------------------------------
# 8. Nginx asosiy konfiguratsiyasi
# -----------------------------------------------
echo "[8/9] Nginx asosiy konfiguratsiya o'rnatilmoqda..."

cat > /etc/nginx/conf.d/gzip.conf << 'NGINX_GZIP'
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css application/json application/javascript
           text/xml application/xml application/xml+rss text/javascript;
NGINX_GZIP

# Management panel nginx config'ini ulash
MGMT_CONF="$SCRIPT_DIR/nginx-management.conf"
if [ -f "$MGMT_CONF" ]; then
  cp "$MGMT_CONF" /etc/nginx/sites-available/management
  ln -sf /etc/nginx/sites-available/management /etc/nginx/sites-enabled/management
fi

nginx -t && systemctl reload nginx

# -----------------------------------------------
# 9. Firewall sozlash (ufw mavjud bo'lsa)
# -----------------------------------------------
echo "[9/9] Firewall sozlanmoqda..."
if command -v ufw &>/dev/null; then
  ufw allow OpenSSH
  ufw allow 'Nginx Full'
  ufw --force enable
  echo "UFW yoqildi: SSH va Nginx ruxsat etildi."
else
  echo "UFW topilmadi, o'tkazib yuborildi."
fi

# -----------------------------------------------
# Yakuniy ma'lumot
# -----------------------------------------------
echo ""
echo "========================================"
echo "  Server sozlash MUVAFFAQIYATLI tugadi  "
echo "========================================"
echo ""
echo "Keyingi qadamlar:"
echo "  1. /opt/qrhujjat/source ga manba kodlarni ko'chiring:"
echo "       cp -r /path/to/Frontend /opt/qrhujjat/source/"
echo "       cp -r /path/to/Backend  /opt/qrhujjat/source/"
echo ""
echo "  2. Management panelni ishga tushiring:"
echo "       cd /opt/qrhujjat/management"
echo "       npm ci && npm run build"
echo "       pm2 start dist/server.js --name qrhujjat-management"
echo ""
echo "  3. Management nginx config'ini sozlang va SSL oling:"
echo "       certbot --nginx -d manage.qrhujjat.uz"
echo ""
echo "  4. Yangi korxona qo'shish:"
echo "       /opt/qrhujjat/scripts/provision-company.sh <slug> <ports...>"
