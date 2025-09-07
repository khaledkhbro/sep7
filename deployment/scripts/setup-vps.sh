#!/bin/bash

# VPS Initial Setup Script for WorkHub
set -e

# Configuration
APP_NAME="workhub"
APP_DIR="/opt/workhub"
APP_USER="workhub"
DOMAIN="your-domain.com"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   error "This script must be run as root for initial setup"
fi

# Update system
log "Updating system packages..."
apt update && apt upgrade -y

# Install required packages
log "Installing required packages..."
apt install -y \
    curl \
    wget \
    git \
    ufw \
    fail2ban \
    htop \
    nginx \
    certbot \
    python3-certbot-nginx \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release

# Install Docker
log "Installing Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Install Docker Compose
log "Installing Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create application user
log "Creating application user..."
useradd -r -s /bin/bash -d "$APP_DIR" -m "$APP_USER"
usermod -aG docker "$APP_USER"

# Setup application directory
log "Setting up application directory..."
mkdir -p "$APP_DIR"/{logs,backups,ssl}
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

# Configure firewall
log "Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Configure fail2ban
log "Configuring fail2ban..."
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
EOF

systemctl enable fail2ban
systemctl start fail2ban

# Setup SSL certificate
log "Setting up SSL certificate..."
certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email admin@"$DOMAIN"

# Setup automatic SSL renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -

# Configure log rotation
log "Setting up log rotation..."
cat > /etc/logrotate.d/workhub << EOF
/var/log/workhub*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $APP_USER $APP_USER
}
EOF

# Setup monitoring script
log "Setting up monitoring..."
cat > /usr/local/bin/workhub-monitor.sh << 'EOF'
#!/bin/bash
# WorkHub Health Monitor

HEALTH_URL="http://localhost/health"
LOG_FILE="/var/log/workhub-monitor.log"

check_health() {
    if ! curl -f "$HEALTH_URL" > /dev/null 2>&1; then
        echo "$(date): Health check failed, restarting services..." >> "$LOG_FILE"
        systemctl restart workhub
        sleep 60
        if ! curl -f "$HEALTH_URL" > /dev/null 2>&1; then
            echo "$(date): Service restart failed, sending alert..." >> "$LOG_FILE"
            # Add your alerting mechanism here (email, webhook, etc.)
        fi
    fi
}

check_health
EOF

chmod +x /usr/local/bin/workhub-monitor.sh

# Setup monitoring cron job
echo "*/5 * * * * /usr/local/bin/workhub-monitor.sh" | crontab -u "$APP_USER" -

# Create systemd service
log "Creating systemd service..."
cp /tmp/workhub.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable workhub

log "VPS setup completed successfully!"
log "Next steps:"
log "1. Clone your repository to $APP_DIR"
log "2. Create .env file with production configuration"
log "3. Run deployment script: sudo -u $APP_USER $APP_DIR/deployment/scripts/deploy.sh"
