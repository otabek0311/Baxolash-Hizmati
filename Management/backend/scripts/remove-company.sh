#!/bin/bash
set -euo pipefail

# ================================================================
# remove-company.sh
# Korxonani to'liq o'chiradi: konteynerlar, volume, fayl, nginx.
#
# Ishlatish:
#   ./remove-company.sh <slug>
#   ./remove-company.sh <slug> --force   (tasdiqlashsiz)
# ================================================================

SLUG="${1:-}"
FORCE="${2:-}"

if [ -z "$SLUG" ]; then
  echo "XATO: slug argument berilmadi." >&2
  echo "Ishlatish: $0 <slug> [--force]" >&2
  exit 1
fi

COMPANY_DIR="/opt/qrhujjat/companies/$SLUG"

# -----------------------------------------------
# Katalog mavjudligini tekshirish
# -----------------------------------------------
if [ ! -d "$COMPANY_DIR" ]; then
  echo "XATO: $SLUG korxonasi topilmadi: $COMPANY_DIR" >&2
  exit 1
fi

# -----------------------------------------------
# Tasdiqlash (--force berilmasa)
# -----------------------------------------------
if [ "$FORCE" != "--force" ]; then
  echo "OGOHLANTIRISH: Bu amal qaytarib bo'lmaydi!"
  echo "  Quyidagilar o'chiriladi:"
  echo "    - $COMPANY_DIR (barcha fayllar)"
  echo "    - Docker konteynerlari va volume ($SLUG)"
  echo "    - Nginx konfiguratsiyasi ($SLUG)"
  echo ""
  read -r -p "Davom etishga ishonchingiz komilmi? [y/N] " CONFIRM
  case "$CONFIRM" in
    y|Y|yes|YES) ;;
    *)
      echo "Bekor qilindi."
      exit 0
      ;;
  esac
fi

echo "=== $SLUG korxonasi o'chirilmoqda ==="

# -----------------------------------------------
# 1. DB backup (ixtiyoriy, --force bo'lsa o'tkaziladi)
# -----------------------------------------------
if [ "$FORCE" != "--force" ]; then
  BACKUP_DIR="/opt/qrhujjat/backups"
  mkdir -p "$BACKUP_DIR"
  BACKUP_FILE="$BACKUP_DIR/${SLUG}_$(date +%Y%m%d_%H%M%S).sql.gz"

  echo "[1/5] DB backup olinmoqda: $BACKUP_FILE"
  if cd "$COMPANY_DIR" && \
     docker-compose ps db 2>/dev/null | grep -q "Up"; then
    docker-compose exec -T db pg_dumpall -U postgres 2>/dev/null \
      | gzip > "$BACKUP_FILE" && \
      echo "  Backup muvaffaqiyatli: $BACKUP_FILE" || \
      echo "  OGOHLANTIRISH: Backup amalga oshmadi (davom etiladi)."
  else
    echo "  DB ishlamayapti, backup o'tkazildi."
  fi
else
  echo "[1/5] Backup o'tkazildi (--force)."
fi

# -----------------------------------------------
# 2. Docker Compose to'xtatish va volume o'chirish
# -----------------------------------------------
echo "[2/5] Docker konteynerlari to'xtatilmoqda..."
if [ -f "$COMPANY_DIR/docker-compose.yml" ]; then
  cd "$COMPANY_DIR"
  docker-compose down -v --remove-orphans 2>/dev/null || \
    echo "  OGOHLANTIRISH: docker-compose down xatolik berdi (davom etiladi)."
  cd /
else
  echo "  docker-compose.yml topilmadi, o'tkazildi."
fi

# Qolgan konteynerlarni majburan o'chirish
for CONTAINER in $(docker ps -a --filter "name=${SLUG}_" --format "{{.Names}}" 2>/dev/null); do
  echo "  Konteyner o'chirilmoqda: $CONTAINER"
  docker rm -f "$CONTAINER" 2>/dev/null || true
done

# Volume'larni o'chirish
for VOL in $(docker volume ls --filter "name=${SLUG}_" --format "{{.Name}}" 2>/dev/null); do
  echo "  Volume o'chirilmoqda: $VOL"
  docker volume rm "$VOL" 2>/dev/null || true
done

# -----------------------------------------------
# 3. Fayl tizimini tozalash
# -----------------------------------------------
echo "[3/5] Fayllar o'chirilmoqda..."
rm -rf "$COMPANY_DIR"
echo "  $COMPANY_DIR o'chirildi."

# -----------------------------------------------
# 4. Nginx konfiguratsiyasini o'chirish
# -----------------------------------------------
echo "[4/5] Nginx konfiguratsiyasi o'chirilmoqda..."
rm -f "/etc/nginx/sites-enabled/$SLUG"
rm -f "/etc/nginx/sites-available/$SLUG"

if nginx -t 2>/dev/null; then
  systemctl reload nginx
  echo "  Nginx qayta yuklandi."
else
  echo "XATO: Nginx konfiguratsiyada xato bor. Qo'lda tekshiring: nginx -t" >&2
fi

# -----------------------------------------------
# 5. Docker image tozalash (ixtiyoriy)
# -----------------------------------------------
echo "[5/5] Foydalanilmayotgan Docker image'lar tozalanmoqda..."
docker image prune -f 2>/dev/null || true

echo ""
echo "=================================================="
echo "  $SLUG korxonasi MUVAFFAQIYATLI o'chirildi."
echo "=================================================="
if [ "$FORCE" != "--force" ] && [ -f "${BACKUP_FILE:-}" ]; then
  echo "  DB backup: $BACKUP_FILE"
fi
