#!/bin/bash
set -euo pipefail

# ================================================================
# suspend-company.sh
# Korxona konteynerlarini to'xtatadi (ma'lumotlar saqlanadi).
#
# Ishlatish:
#   ./suspend-company.sh <slug>
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

echo "=== $SLUG to'xtatilmoqda ==="
cd "$COMPANY_DIR"

# Konteyner holati
RUNNING=$(docker-compose ps --services --filter "status=running" 2>/dev/null | wc -l || echo 0)

if [ "$RUNNING" -eq 0 ]; then
  echo "  $SLUG allaqachon to'xtatilgan."
  exit 0
fi

docker-compose stop

echo ""
echo "  $SLUG muvaffaqiyatli to'xtatildi."
echo "  Qayta ishga tushirish: /opt/qrhujjat/scripts/start-company.sh $SLUG"
