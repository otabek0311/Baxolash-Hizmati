#!/bin/bash
set -euo pipefail

# ================================================================
# start-company.sh
# To'xtatilgan korxona konteynerlarini qayta ishga tushiradi.
#
# Ishlatish:
#   ./start-company.sh <slug>
# ================================================================

SLUG="${1:-}"

if [ -z "$SLUG" ]; then
  echo "XATO: slug argument berilmadi." >&2
  echo "Ishlatish: $0 <slug>" >&2
  exit 1
fi

COMPANY_DIR="/opt/qrhujjat/companies/$SLUG"

if [ ! -d "$COMPANY_DIR" ]; then
  echo "XATO: $SLUG korxonasi topilmadi: $COMPANY_DIR" >&2
  exit 1
fi

if [ ! -f "$COMPANY_DIR/docker-compose.yml" ]; then
  echo "XATO: docker-compose.yml topilmadi: $COMPANY_DIR" >&2
  exit 1
fi

echo "=== $SLUG ishga tushirilmoqda ==="
cd "$COMPANY_DIR"

# Konteyner holati
RUNNING=$(docker-compose ps --services --filter "status=running" 2>/dev/null | wc -l || echo 0)

if [ "$RUNNING" -gt 0 ]; then
  echo "  $SLUG allaqachon ishlamoqda."
  docker-compose ps
  exit 0
fi

docker-compose start

# Holat tekshiruvi
echo "  Konteynerlar holati:"
docker-compose ps

echo ""
echo "  $SLUG muvaffaqiyatli ishga tushirildi."
echo "  Loglarni ko'rish: cd $COMPANY_DIR && docker-compose logs -f"
