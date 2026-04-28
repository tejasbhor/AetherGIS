#!/bin/bash
# ============================================================
# AetherGIS — Server Initialization Script
# Run once on a fresh OCI ARM instance (Ubuntu 22.04)
# Usage: chmod +x init-server.sh && ./init-server.sh
# ============================================================
set -euo pipefail

echo "🚀 AetherGIS Server Setup — OCI ARM64"
echo "======================================="

# ---- 1. System Updates ----
echo ""
echo "📦 [1/7] Updating system packages..."
sudo apt-get update && sudo apt-get upgrade -y

# ---- 2. Install Docker ----
echo ""
echo "🐳 [2/7] Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    sudo systemctl enable docker
    sudo systemctl start docker
    echo "✅ Docker installed"
else
    echo "✅ Docker already installed"
fi

# Install Docker Compose plugin if missing
if ! docker compose version &> /dev/null; then
    sudo apt-get install -y docker-compose-plugin
    echo "✅ Docker Compose plugin installed"
else
    echo "✅ Docker Compose plugin already installed"
fi

# ---- 3. Create directory structure ----
echo ""
echo "📁 [3/7] Creating directory structure..."
# Ensure /opt/aethergis exists and has correct permissions
sudo mkdir -p /opt/aethergis/data/{postgres,redis,runs,exports,cache,logs,caddy/data,caddy/config,backups}
sudo mkdir -p /opt/aethergis/scripts
sudo chown -R $USER:$USER /opt/aethergis
echo "✅ Directories created"

# ---- 4. Setup Swap (4 GB safety net) ----
# Critical for AI models if they spill over RAM
echo ""
echo "💾 [4/7] Setting up 4 GB swap..."
if [ ! -f /swapfile ]; then
    sudo fallocate -l 4G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "✅ Swap configured"
else
    echo "✅ Swap already exists"
fi

# ---- 5. Firewall ----
echo ""
echo "🔒 [5/7] Configuring firewall (UFW)..."
sudo apt-get install -y ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw --force enable
echo "✅ Firewall configured (SSH, HTTP, HTTPS only)"

# ---- 6. Fail2Ban ----
echo ""
echo "🛡️ [6/7] Installing fail2ban..."
sudo apt-get install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
echo "✅ Fail2ban active"

# ---- 7. Unattended security upgrades ----
echo ""
echo "🔄 [7/7] Enabling unattended security upgrades..."
sudo apt-get install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
echo "✅ Unattended upgrades enabled"

# ---- Summary ----
echo ""
echo "============================================="
echo "✅ AetherGIS server initialization complete!"
echo "============================================="
echo ""
echo "📋 Next steps:"
echo ""
echo "  1. Clone the repo:"
echo "     git clone https://github.com/tejasbhor/AetherGIS.git /opt/aethergis"
echo ""
echo "  2. Login to GitHub Container Registry (if using GHCR):"
echo "     echo '<GITHUB_PAT>' | docker login ghcr.io -u tejasbhor --password-stdin"
echo ""
echo "  3. Create production .env:"
echo "     cp /opt/aethergis/.env.example /opt/aethergis/.env"
echo "     nano /opt/aethergis/.env   # Fill in production secrets"
echo ""
echo "  4. Start services:"
echo "     cd /opt/aethergis && docker compose up -d"
echo ""
echo "  5. Verify health:"
echo "     docker compose ps"
echo ""
echo "⚠️  IMPORTANT: Log out and back in for Docker group membership to take effect!"
