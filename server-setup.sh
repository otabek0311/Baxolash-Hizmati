#!/bin/bash
# Hetzner Ubuntu 24.04 server uchun birinchi marta sozlash
# Ishlatish: bash server-setup.sh

set -e

echo "=== Tizim yangilanmoqda ==="
apt update && apt upgrade -y

echo "=== Node.js 20 o'rnatilmoqda ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo "=== PM2 o'rnatilmoqda ==="
npm install -g pm2
pm2 startup systemd -u root --hp /root

echo "=== PostgreSQL o'rnatilmoqda ==="
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

echo "=== LibreOffice o'rnatilmoqda (Word->PDF) ==="
apt install -y libreoffice --no-install-recommends

echo "=== Nginx o'rnatilmoqda ==="
apt install -y nginx
systemctl enable nginx

echo "=== Fail2ban o'rnatilmoqda ==="
apt install -y fail2ban
systemctl enable fail2ban

echo "=== Firewall sozlanmoqda ==="
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "=== PostgreSQL sozlanmoqda ==="
read -s -p "PostgreSQL uchun kuchli parol kiriting: " DB_PASS
echo ""
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='qrhujjat'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE DATABASE qrhujjat;"
sudo -u postgres psql -c "ALTER USER postgres PASSWORD '$DB_PASS';"

echo "=== Loyiha papkasi yaratilmoqda ==="
mkdir -p /var/www/qr-hujjat-tizimi

echo "=== Git repo clone/pull qilinmoqda ==="
if [ -d "/var/www/qr-hujjat-tizimi/.git" ]; then
  cd /var/www/qr-hujjat-tizimi
  git pull origin main
else
  git clone https://github.com/otabek0311/QR_HUJJAT_TIZIMI.git /var/www/qr-hujjat-tizimi
  cd /var/www/qr-hujjat-tizimi
fi

echo ""
echo "==========================================="
echo ">>> MUHIM: .env faylini tahrirlang!"
echo ">>> DATABASE_URL dagi parolni '$DB_PASS' ga o'zgartiring"
echo ">>> BASE_URL ni server IP ga o'zgartiring"
echo ">>> NODE_ENV ni 'production' ga o'zgartiring"
echo ">>> SUPERADMIN_PASSWORD va ADMIN_PASSWORD ni kiriting"
echo "==========================================="
cd Backend
cp .env.example .env
nano .env

read -p ">>> .env tahrirlandi. Davom etish uchun ENTER bosing..." _

echo "=== Backend sozlanmoqda ==="
npm install --production=false
npx prisma generate
npx prisma migrate deploy
npm run build
mkdir -p uploads processed

echo "=== SuperAdmin seed qilinmoqda ==="
npx ts-node prisma/seed.ts || echo "Seed o'tkazib yuborildi (allaqachon mavjud bo'lishi mumkin)"

pm2 start dist/app.js --name qr-backend --env production
pm2 save
cd ..

echo "=== Frontend sozlanmoqda ==="
cd Frontend
npm install
npm run build
cd ..

echo "=== Nginx sozlanmoqda ==="
cat > /etc/nginx/sites-available/qr-hujjat << 'EOF'
server {
    listen 80;
    server_name _;

    client_max_body_size 150M;

    # Frontend
    root /var/www/qr-hujjat-tizimi/Frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
        proxy_connect_timeout 10s;
    }

    gzip on;
    gzip_types text/plain text/css application/javascript application/json;
}
EOF

ln -sf /etc/nginx/sites-available/qr-hujjat /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo ""
echo "=== TAYYOR! ==="
echo "Brauzerda oching: http://$(curl -s ifconfig.me)"
echo ""
echo "Keyingi qadam (HTTPS uchun):"
echo "  apt install certbot python3-certbot-nginx"
echo "  certbot --nginx -d sizningdomen.uz"
