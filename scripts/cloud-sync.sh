#!/bin/bash
set -e # Exit on error

# =====================================================
# AetherGIS — Cloud Sync & Redeploy Script
# Optimized for Oracle Cloud (OCI Ampere)
# =====================================================

# Color coding
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting AetherGIS Production Update...${NC}"

# 1. PERMISSION & DIRECTORY
sudo chown -R $USER:$USER /opt/aethergis
git config --global --add safe.directory /opt/aethergis
cd /opt/aethergis

# 2. SYNC CODE
echo -e "${GREEN}📥 [1/6] Syncing with GitHub...${NC}"
git fetch origin main
git reset --hard origin/main

# 3. STOP SERVICES
echo -e "${GREEN}🛑 [2/6] Stopping containers...${NC}"
docker compose down --remove-orphans

# 4. REBUILD SERVICES (Sequential to save OCI memory)
echo -e "${GREEN}🏗️ [3/6] Rebuilding Backend & Worker...${NC}"
# Rebuilding these together as they share the same base code
docker compose build backend worker

echo -e "${GREEN}🏗️ [4/6] Rebuilding Frontend...${NC}"
docker compose build frontend

# 5. CLEAN UP (Safe Prune)
echo -e "${GREEN}🧹 Cleaning up build artifacts...${NC}"
docker system prune -f

# 6. START SERVICES
echo -e "${GREEN}🚀 [5/6] Starting services...${NC}"
docker compose up -d

# 7. DATABASE HEALTHCHECK
echo -e "${GREEN}⌛ [6/6] Waiting for PostGIS to be ready...${NC}"
MAX_RETRIES=30
COUNT=0
# Note: Using 'aethergis' as the user and DB name
until docker compose exec postgres pg_isready -U aethergis -d aethergis > /dev/null 2>&1; do
  COUNT=$((COUNT + 1))
  if [ $COUNT -ge $MAX_RETRIES ]; then
    echo -e "${RED}❌ Database failed to start in time.${NC}"
    exit 1
  fi
  echo -n "."
  sleep 2
done
echo -e "\n${GREEN}✅ Database is ready!${NC}"

echo -e "${GREEN}✨ UPDATE COMPLETE! AetherGIS is live.${NC}"
echo -e "Monitor live logs with: ${YELLOW}docker compose logs -f backend${NC}"
echo -e "Access the portal at: ${YELLOW}http://129.213.145.9${NC}"
