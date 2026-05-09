# QR Hujjat Tizimi — Server Boshqaruv Qo'llanmasi

## Mundarija
1. [Server dastlabki sozlash](#1-server-dastlabki-sozlash)
2. [Management panelni o'rnatish](#2-management-panelni-ornatish)
3. [Yangi korxona qo'shish](#3-yangi-korxona-qoshish)
4. [Korxonani boshqarish](#4-korxonani-boshqarish)
5. [Loglarni ko'rish](#5-loglarni-korish)
6. [Ma'lumotlar bazasini zaxiralash](#6-malumotlar-bazasini-zaxiralash)
7. [Click va Payme sozlash](#7-click-va-payme-sozlash)
8. [Umumiy muammolar va yechimlar](#8-umumiy-muammolar-va-yechimlar)

---

## 1. Server dastlabki sozlash

**Talab:** Ubuntu 22.04 LTS, minimal o'rnatish, root yoki sudo huquqi.

### 1.1 Manba kodni serverga ko'chirish

```bash
# Mahalliy kompyuterdan serverga yuborish
scp -r ./Management/backend/scripts/ root@SERVER_IP:/tmp/scripts

# Serverda
ssh root@SERVER_IP
```

### 1.2 Manba kodini server papkasiga ko'chirish

```bash
mkdir -p /opt/qrhujjat/source
cp -r /path/to/project/Frontend /opt/qrhujjat/source/
cp -r /path/to/project/Backend  /opt/qrhujjat/source/
```

### 1.3 Setup skriptini ishga tushirish

```bash
chmod +x /tmp/scripts/setup-server.sh
bash /tmp/scripts/setup-server.sh
```

Skript quyidagilarni o'rnatadi:
- Docker CE + docker-compose
- Node.js 20 + PM2
- Nginx
- Certbot (SSL)
- Katalog tuzilmasi: `/opt/qrhujjat/`

---

## 2. Management panelni o'rnatish

Management panel `manage.qrhujjat.uz` domenida ishlaydi (port 7000 — API, port 7100 — frontend).

### 2.1 Backend (API)

```bash
cd /opt/qrhujjat/management
cp -r /path/to/Management/backend/* .

# .env faylini yaratish
cat > .env << 'EOF'
PORT=7000
NODE_ENV=production
DATABASE_URL=postgresql://mgmt_user:PAROL@localhost:5433/mgmt_db
JWT_SECRET=$(openssl rand -hex 32)
EOF

npm ci
npm run build
pm2 start dist/server.js --name qrhujjat-management
pm2 save
```

### 2.2 Frontend (agar alohida bo'lsa)

```bash
# Management frontend portini 7100 ga o'rnatish
pm2 start "npx vite preview --port 7100 --host" --name qrhujjat-mgmt-frontend
pm2 save
```

### 2.3 Nginx konfiguratsiyasi

```bash
cp /opt/qrhujjat/scripts/nginx-management.conf /etc/nginx/sites-available/management
ln -sf /etc/nginx/sites-available/management /etc/nginx/sites-enabled/management
nginx -t && systemctl reload nginx
```

### 2.4 SSL sertifikat olish

```bash
certbot --nginx -d manage.qrhujjat.uz
```

---

## 3. Yangi korxona qo'shish

### 3.1 Portlarni rejalashtirish

Har bir korxona uchun 3 ta port kerak:

| Korxona  | Frontend | Backend API | PostgreSQL |
|----------|----------|-------------|------------|
| acme     | 3100     | 4100        | 5532       |
| globex   | 3101     | 4101        | 5533       |
| initech  | 3102     | 4102        | 5534       |

### 3.2 Provision skriptini ishga tushirish

```bash
/opt/qrhujjat/scripts/provision-company.sh \
  acme \          # slug (kichik harf, defis ruxsat)
  3100 \          # frontend port
  4100 \          # backend port
  5532 \          # db port
  acme_db \       # db nomi
  acme_user \     # db foydalanuvchisi
  "S3cr3tP@ss!" \ # db paroli
  acme.qrhujjat.uz  # domen (ixtiyoriy, default: slug.qrhujjat.uz)
```

Skript avtomatik qiladi:
- Frontend va backend manba kodini nusxalaydi
- `.env` fayllarini yaratadi (JWT secret avtomatik generatsiya)
- `docker-compose.yml` va Dockerfile larni yaratadi
- Konteynerlarni build qilib ishga tushiradi
- Prisma migratsiyalarni ishga tushiradi
- Nginx konfiguratsiyasini qo'shadi

### 3.3 SSL sertifikat olish (korxona uchun)

```bash
certbot --nginx -d acme.qrhujjat.uz
```

### 3.4 Tekshirish

```bash
# Konteynerlar holati
cd /opt/qrhujjat/companies/acme
docker-compose ps

# Sayt ishlayaptimi
curl -I http://acme.qrhujjat.uz
```

---

## 4. Korxonani boshqarish

### To'xtatish (ma'lumotlar saqlanadi)

```bash
/opt/qrhujjat/scripts/suspend-company.sh acme
```

### Qayta ishga tushirish

```bash
/opt/qrhujjat/scripts/start-company.sh acme
```

### To'liq o'chirish (qaytarib bo'lmaydi!)

```bash
# Tasdiqlash so'raladi + backup olinadi
/opt/qrhujjat/scripts/remove-company.sh acme

# Tasdiqlashsiz (avtomatik jarayonlar uchun)
/opt/qrhujjat/scripts/remove-company.sh acme --force
```

### Resurs statistikasi (JSON)

```bash
/opt/qrhujjat/scripts/get-stats.sh acme
# {"isRunning":true,"cpuPercent":2.45,"memoryMb":312.5,"diskMb":128,"containers":3}
```

---

## 5. Loglarni ko'rish

### Barcha konteynerlar loglari

```bash
cd /opt/qrhujjat/companies/acme
docker-compose logs -f
```

### Faqat backend loglari

```bash
docker-compose logs -f backend
```

### Faqat frontend loglari

```bash
docker-compose logs -f frontend
```

### DB loglari

```bash
docker-compose logs -f db
```

### So'nggi N ta satr

```bash
docker-compose logs --tail=100 backend
```

### Nginx loglari

```bash
# Kirish loglari
tail -f /var/log/nginx/access.log

# Xato loglari
tail -f /var/log/nginx/error.log

# Muayyan korxona
tail -f /var/log/nginx/acme.access.log
```

### PM2 loglari (management panel)

```bash
pm2 logs qrhujjat-management
pm2 logs qrhujjat-management --lines 50
```

---

## 6. Ma'lumotlar bazasini zaxiralash

### Bir korxona DB ni zaxiralash

```bash
SLUG=acme
DB_USER=acme_user
DB_NAME=acme_db
BACKUP_FILE="/opt/qrhujjat/backups/${SLUG}_$(date +%Y%m%d_%H%M%S).sql.gz"

mkdir -p /opt/qrhujjat/backups

docker exec ${SLUG}_db_1 \
  pg_dump -U $DB_USER $DB_NAME \
  | gzip > "$BACKUP_FILE"

echo "Backup saqlandi: $BACKUP_FILE"
```

### Konteyner nomini bilmasangiz

```bash
# Konteyner nomini aniqlash
docker ps --filter "name=acme" --format "{{.Names}}"

# Yoki docker-compose orqali
cd /opt/qrhujjat/companies/acme
docker-compose exec db pg_dump -U acme_user acme_db | gzip > backup.sql.gz
```

### Barcha korxonalarni zaxiralash (cron uchun)

```bash
#!/bin/bash
# /opt/qrhujjat/scripts/backup-all.sh
BACKUP_DIR="/opt/qrhujjat/backups/$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

for COMPANY_DIR in /opt/qrhujjat/companies/*/; do
  SLUG=$(basename "$COMPANY_DIR")
  cd "$COMPANY_DIR"

  # .env dan DB ma'lumotlarini olish
  DB_USER=$(grep POSTGRES_USER docker-compose.yml | head -1 | awk '{print $2}')

  docker-compose exec -T db pg_dumpall -U postgres 2>/dev/null \
    | gzip > "$BACKUP_DIR/${SLUG}.sql.gz" && \
    echo "$SLUG: backup muvaffaqiyatli" || \
    echo "$SLUG: backup xatolik"
done

# 30 kundan eski backuplarni o'chirish
find /opt/qrhujjat/backups -name "*.sql.gz" -mtime +30 -delete
```

### Cron orqali har kecha zaxiralash

```bash
crontab -e
# Quyidagi satrni qo'shing:
# 0 2 * * * /opt/qrhujjat/scripts/backup-all.sh >> /var/log/qrhujjat-backup.log 2>&1
```

### Backupdan tiklash

```bash
SLUG=acme
BACKUP_FILE="/opt/qrhujjat/backups/acme_20250430_020000.sql.gz"

cd /opt/qrhujjat/companies/$SLUG
gunzip -c "$BACKUP_FILE" | docker-compose exec -T db psql -U acme_user acme_db
```

---

## 7. Click va Payme sozlash

### 7.1 Click sozlash

`/opt/qrhujjat/companies/{slug}/backend/.env` fayliga qo'shing:

```bash
# Click to'lov tizimi
CLICK_SERVICE_ID=12345
CLICK_MERCHANT_ID=67890
CLICK_SECRET_KEY=your_click_secret_key
CLICK_MERCHANT_USER_ID=11111
```

Click dashboard: https://my.click.uz

### 7.2 Payme sozlash

```bash
# Payme to'lov tizimi
PAYME_MERCHANT_ID=your_payme_merchant_id
PAYME_SECRET_KEY=your_payme_secret_key
PAYME_TEST_SECRET_KEY=your_test_secret_key
PAYME_TEST_MODE=false  # Ishlab chiqishda true
```

Payme dashboard: https://merchant.payme.uz

### 7.3 .env o'zgartirish va qayta ishga tushirish

```bash
cd /opt/qrhujjat/companies/acme

# .env faylni tahrirlash
nano backend/.env

# Faqat backend'ni qayta ishga tushirish
docker-compose restart backend
```

---

## 8. Umumiy muammolar va yechimlar

### Konteyner ishlamayapti

```bash
cd /opt/qrhujjat/companies/acme

# Holatni tekshirish
docker-compose ps

# Xato loglarni ko'rish
docker-compose logs --tail=50 backend

# Qayta ishga tushirish
docker-compose restart backend
```

### Port band

```bash
# Band portlarni ko'rish
ss -tuln | grep ':3100'

# Qaysi jarayon port ishlatayotganini bilish
lsof -i :3100
```

### Nginx 502 Bad Gateway

```bash
# Backend ishlaяptimi?
cd /opt/qrhujjat/companies/acme && docker-compose ps

# Nginx konfiguratsiyani tekshirish
nginx -t

# Nginx qayta yuklash
systemctl reload nginx
```

### DB ulanish xatosi

```bash
cd /opt/qrhujjat/companies/acme

# DB holati
docker-compose exec db pg_isready -U acme_user

# DB loglar
docker-compose logs db

# DB ga ulanish
docker-compose exec db psql -U acme_user -d acme_db
```

### Disk to'lgan

```bash
# Disk holati
df -h

# Docker qoldiqlari (istifoda qilinmayotgan imagelar, volumelar)
docker system prune -f

# Eng katta fayllarni topish
du -sh /opt/qrhujjat/companies/* | sort -hr | head -10
```

### Konteyner ichiga kirish

```bash
cd /opt/qrhujjat/companies/acme

# Backend shell
docker-compose exec backend sh

# DB shell
docker-compose exec db psql -U acme_user -d acme_db
```

### Prisma migratsiya xatosi

```bash
cd /opt/qrhujjat/companies/acme

# Migratsiyalarni qayta bajarish
docker-compose exec backend npx prisma migrate deploy

# Migratsiya holati
docker-compose exec backend npx prisma migrate status
```

### SSL sertifikat yangilash

```bash
# Barcha sertifikatlarni yangilash
certbot renew

# Muayyan domen
certbot renew --cert-name acme.qrhujjat.uz
```

---

## Tezkor ma'lumotnoma

| Vazifa                        | Buyruq |
|-------------------------------|--------|
| Yangi korxona                 | `provision-company.sh slug 3100 4100 5532 db_name db_user pass` |
| Korxonani to'xtatish          | `suspend-company.sh slug` |
| Korxonani ishga tushirish     | `start-company.sh slug` |
| Korxonani o'chirish           | `remove-company.sh slug` |
| Statistika                    | `get-stats.sh slug` |
| Loglar                        | `cd /opt/qrhujjat/companies/slug && docker-compose logs -f` |
| DB backup                     | `docker-compose exec db pg_dump -U user db \| gzip > backup.sql.gz` |
| SSL olish                     | `certbot --nginx -d slug.qrhujjat.uz` |
| Barcha korxonalar             | `ls /opt/qrhujjat/companies/` |
