#!/bin/bash
# ================================================================
# get-stats.sh
# Korxona Docker konteynerlarining resurs statistikasini
# JSON formatida qaytaradi.
#
# Ishlatish:
#   ./get-stats.sh <slug>
#
# Chiqish (JSON):
#   {
#     "isRunning": true,
#     "cpuPercent": 3.14,
#     "memoryMb": 256.5,
#     "diskMb": 1024,
#     "containers": 3,
#     "uptime": "2h 15m"
#   }
# ================================================================

SLUG="${1:-}"

if [ -z "$SLUG" ]; then
  echo '{"error":"slug argument berilmadi","isRunning":false}' >&2
  exit 1
fi

COMPANY_DIR="/opt/qrhujjat/companies/$SLUG"
EMPTY_JSON='{"isRunning":false,"cpuPercent":0,"memoryMb":0,"diskMb":0,"containers":0}'

# -----------------------------------------------
# Katalog va docker-compose tekshiruvi
# -----------------------------------------------
if [ ! -d "$COMPANY_DIR" ]; then
  echo "$EMPTY_JSON"
  exit 0
fi

# -----------------------------------------------
# Ishlaётgan konteynerlarni topish
# -----------------------------------------------
CONTAINERS=$(docker ps \
  --filter "name=${SLUG}" \
  --format "{{.Names}}" 2>/dev/null || true)

if [ -z "$CONTAINERS" ]; then
  echo "$EMPTY_JSON"
  exit 0
fi

CONTAINER_COUNT=$(echo "$CONTAINERS" | wc -l)

# -----------------------------------------------
# Docker stats (bir martalik o'lchash)
# -----------------------------------------------
# Format: ContainerName,CPUPerc%,MemUsage / MemLimit,Status
STATS_RAW=$(docker stats --no-stream \
  --format "{{.Name}},{{.CPUPerc}},{{.MemUsage}}" \
  $CONTAINERS 2>/dev/null || true)

if [ -z "$STATS_RAW" ]; then
  echo "$EMPTY_JSON"
  exit 0
fi

# -----------------------------------------------
# Disk foydalanish (pgdata volume)
# -----------------------------------------------
DISK_MB=0
VOL_NAME="${SLUG}_pgdata"
VOL_PATH=$(docker volume inspect "$VOL_NAME" \
  --format '{{.Mountpoint}}' 2>/dev/null || true)

if [ -n "$VOL_PATH" ] && [ -d "$VOL_PATH" ]; then
  DISK_MB=$(du -sm "$VOL_PATH" 2>/dev/null | awk '{print $1}' || echo 0)
fi

# -----------------------------------------------
# CPU va Memory'ni hisoblash (awk)
# -----------------------------------------------
RESULT=$(echo "$STATS_RAW" | awk -v disk="$DISK_MB" -v count="$CONTAINER_COUNT" '
BEGIN {
  total_cpu = 0
  total_mem = 0
}
{
  # CPU: "3.14%"  => 3.14
  n = split($0, fields, ",")
  cpu_str = fields[2]
  sub(/%/, "", cpu_str)
  total_cpu += cpu_str + 0

  # Memory: "256.5MiB / 2GiB" => bytes
  mem_str = fields[3]
  # Olingan qiymat: "256.5MiB"
  unit = mem_str
  gsub(/[0-9.]+/, "", unit)
  gsub(/ .*/, "", unit)

  val = mem_str
  gsub(/[^0-9.]/, "", val)
  val = val + 0

  # MiB ga o'tkazish
  if (unit ~ /GiB/)      val = val * 1024
  else if (unit ~ /kB/)  val = val / 1024
  else if (unit ~ /B/ && unit !~ /iB/) val = val / 1048576

  total_mem += val
}
END {
  printf "{\"isRunning\":true,\"cpuPercent\":%.2f,\"memoryMb\":%.1f,\"diskMb\":%s,\"containers\":%s}",
    total_cpu, total_mem, disk, count
}')

echo "$RESULT"
