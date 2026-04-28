#!/bin/bash
# ============================================================
# AetherGIS — Automated Backup Script
# Schedule via cron: 0 2 * * * /opt/aethergis/scripts/oci/backup.sh
# ============================================================
set -euo pipefail

PROJECT_DIR="/opt/aethergis"
BACKUP_DIR="${PROJECT_DIR}/data/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=14

# Load environment variables
if [ -f "${PROJECT_DIR}/.env" ]; then
    export $(grep -v '^#' "${PROJECT_DIR}/.env" | xargs)
fi

echo "🗃️ Starting AetherGIS backup — ${DATE}"

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

# Database backup (PostGIS)
echo "  📊 Backing up PostGIS..."
docker compose -f "${PROJECT_DIR}/docker-compose.yml" exec -T postgres \
    pg_dump -U "${POSTGRES_USER:-aethergis}" "${POSTGRES_DB:-aethergis}" \
    | gzip > "${BACKUP_DIR}/db_${DATE}.sql.gz"

DB_SIZE=$(du -h "${BACKUP_DIR}/db_${DATE}.sql.gz" | cut -f1)
echo "  ✅ Database backup: ${DB_SIZE}"

# Redis backup (trigger save first)
echo "  🔴 Backing up Redis..."
docker compose -f "${PROJECT_DIR}/docker-compose.yml" exec -T redis \
    redis-cli -a "${REDIS_PASSWORD:-aetherredispass}" BGSAVE 2>/dev/null
sleep 10

if [ -f "${PROJECT_DIR}/data/redis/dump.rdb" ]; then
    cp "${PROJECT_DIR}/data/redis/dump.rdb" "${BACKUP_DIR}/redis_${DATE}.rdb"
    REDIS_SIZE=$(du -h "${BACKUP_DIR}/redis_${DATE}.rdb" | cut -f1)
    echo "  ✅ Redis backup: ${REDIS_SIZE}"
else
    echo "  ⚠️  Redis dump.rdb not found in /opt/aethergis/data/redis/"
fi

# Cleanup old backups
echo "  🧹 Removing backups older than ${RETENTION_DAYS} days..."
DELETED=$(find "${BACKUP_DIR}" -name "db_*.sql.gz" -mtime +${RETENTION_DAYS} -delete -print | wc -l)
DELETED=$((DELETED + $(find "${BACKUP_DIR}" -name "redis_*.rdb" -mtime +${RETENTION_DAYS} -delete -print | wc -l)))
echo "  ✅ Removed ${DELETED} old backup files"

echo ""
echo "✅ Backup complete!"
echo "📁 Backups in: ${BACKUP_DIR}"
ls -lh "${BACKUP_DIR}"/db_${DATE}* "${BACKUP_DIR}"/redis_${DATE}* 2>/dev/null || true
