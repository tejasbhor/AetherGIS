#!/bin/bash
# ============================================================
# AetherGIS — Deployment Script
# Usage: ./scripts/oci/deploy.sh
# ============================================================
set -euo pipefail

PROJECT_DIR="/opt/aethergis"

echo "🚀 AetherGIS Deployment"
echo "========================"
echo "Time: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo ""

cd "$PROJECT_DIR"

# Pull latest images
echo "📦 Pulling latest images..."
docker compose pull frontend backend worker

# Recreate application containers
echo "🔄 Recreating application containers..."
docker compose up -d --no-deps --force-recreate frontend backend worker caddy

# Wait for backend to be healthy
echo "⏳ Waiting for backend to become healthy..."
for i in {1..30}; do
    if curl -sf http://localhost:8000/api/v1/health > /dev/null 2>&1; then
        echo "✅ Backend is healthy"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Backend did not become healthy in time"
        docker compose logs --tail=50 backend
        exit 1
    fi
    sleep 2
done

# Run database migrations if any (assuming alembic is used)
# Note: In AetherGIS v2.0, ensure your migration command is correct
# echo "🗃️ Running database migrations..."
# docker compose exec -T backend uv run alembic upgrade head

# Verify all services
echo ""
echo "🏥 Verifying services..."
echo "========================"

check_service() {
    local name=$1
    local url=$2
    if curl -sf "$url" > /dev/null 2>&1; then
        echo "  ✅ ${name}"
        return 0
    else
        echo "  ❌ ${name}"
        return 1
    fi
}

check_service "API Backend" "http://localhost:8000/api/v1/health"
check_service "Frontend"    "http://localhost:80"

# Clean up old images
echo ""
echo "🧹 Cleaning up old images..."
docker image prune -f

echo ""
echo "✅ Deployment complete!"
echo "Time: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
