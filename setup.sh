#!/bin/bash

# IMSys ISP Manager - Setup Wizard
# This script initializes the environment, generates secrets, and prepares the system.

set -e # Exit on error

echo "=================================================="
echo "🚀 Welcome to IMSys ISP Manager Setup Wizard"
echo "=================================================="

# 1. Check for Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found!"
    read -p "Do you want to install Docker automatically? (y/n) " INSTALL_DOCKER
    if [[ "$INSTALL_DOCKER" == "y" || "$INSTALL_DOCKER" == "Y" ]]; then
        echo "⬇️  Installing Docker..."
        curl -fsSL https://get.docker.com | sh
        echo "✅ Docker installed."
        echo "⚠️  You may need to log out and log back in for group changes to take effect."
        sudo usermod -aG docker $USER || true
    else
        echo "Please install Docker manually and run this script again."
        exit 1
    fi
else
    echo "✅ Docker is installed."
fi

# 2. Gather Configuration
echo ""
echo "--- Configuration ---"
read -p "Enter your primary domain (e.g., isp.com): " DOMAIN
read -p "Enter VPN Admin Password (for WireGuard UI): " WG_PASS

if [ -z "$DOMAIN" ]; then
    echo "❌ Domain cannot be empty."
    exit 1
fi

if [ -z "$WG_PASS" ]; then
    WG_PASS="admin123"
    echo "⚠️  No password provided. Defaulting to: admin123"
fi

# 3. Generate Secrets
echo ""
echo "--- Security ---"
echo "🔐 Generating secure keys..."

# Use openssl to generate random hex strings
JWT_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 32) # Must be 32 bytes (64 hex chars)
MONGO_PASS=$(openssl rand -hex 16)

echo "✅ Keys generated."

# 4. Create .env File
echo ""
echo "--- Creating Environment File ---"

cat <<EOF > .env
# --- General ---
NODE_ENV=production
DOMAIN=$DOMAIN

# --- Database ---
MONGO_URI=mongodb://mongo:27017/isp_management
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=$MONGO_PASS

# --- Security ---
JWT_SECRET=$JWT_SECRET
ENCRYPTION_KEY=$ENCRYPTION_KEY

# --- VPN (WireGuard) ---
WG_HOST=vpn.$DOMAIN
WG_PASSWORD=$WG_PASS

# --- Integrations (Placeholders) ---
SMS_API_KEY=
DARAJA_CONSUMER_KEY=
DARAJA_CONSUMER_SECRET=
EOF

echo "✅ .env file created successfully."

# 5. Update Caddyfile with Real Domain
echo ""
echo "--- Configuring Web Server ---"
# We need to replace the placeholders in Caddyfile with the real domain
# For testing locally, we kept :80/:443. For prod, we switch to domain.

# Create a production Caddyfile
cat <<EOF > Caddyfile.prod
{
    email admin@$DOMAIN
}

$DOMAIN {
    reverse_proxy frontend:3000
}

api.$DOMAIN {
    reverse_proxy backend:5000
}

vpn.$DOMAIN {
    reverse_proxy wireguard:51821
}
EOF

echo "✅ Caddyfile.prod created."
echo "ℹ️  Note: The system uses 'Caddyfile' by default. To use the production domains,"
echo "    run: cp Caddyfile.prod Caddyfile"

# 6. Launch Option
echo ""
echo "=================================================="
echo "🎉 Setup Complete!"
echo "=================================================="
echo "To start the system, run:"
echo "  cp Caddyfile.prod Caddyfile  # (If you are ready for real domains)"
echo "  docker-compose -f docker-compose.prod.yml up -d"
echo ""

read -p "Do you want to start the system now (using default Caddyfile)? (y/n) " START_NOW
if [[ "$START_NOW" == "y" || "$START_NOW" == "Y" ]]; then
    docker-compose -f docker-compose.prod.yml up -d
    echo "🚀 System starting in background..."
    echo "Check status with: docker-compose -f docker-compose.prod.yml ps"
fi
