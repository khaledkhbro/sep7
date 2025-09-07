#!/bin/bash

# WorkHub VPS Deployment Script
set -e

# Configuration
APP_NAME="workhub"
APP_DIR="/opt/workhub"
BACKUP_DIR="/opt/workhub/backups"
LOG_FILE="/var/log/workhub-deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root for security reasons"
fi

# Check required commands
for cmd in docker docker-compose git; do
    if ! command -v $cmd &> /dev/null; then
        error "$cmd is not installed"
    fi
done

# Create backup
create_backup() {
    log "Creating backup..."
    mkdir -p "$BACKUP_DIR"
    
    # Backup database
    docker-compose -f "$APP_DIR/docker-compose.prod.yml" exec -T postgres pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_DIR/db_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    # Backup application files
    tar -czf "$BACKUP_DIR/app_backup_$(date +%Y%m%d_%H%M%S).tar.gz" -C "$APP_DIR" --exclude=backups .
    
    # Keep only last 7 backups
    find "$BACKUP_DIR" -name "*.sql" -mtime +7 -delete
    find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete
    
    log "Backup completed"
}

# Deploy application
deploy() {
    log "Starting deployment..."
    
    cd "$APP_DIR"
    
    # Pull latest changes
    log "Pulling latest code..."
    git pull origin main
    
    # Build and deploy
    log "Building and starting services..."
    docker-compose -f docker-compose.prod.yml build --no-cache
    docker-compose -f docker-compose.prod.yml up -d
    
    # Wait for services to be healthy
    log "Waiting for services to be healthy..."
    sleep 30
    
    # Check health
    if ! curl -f http://localhost/health > /dev/null 2>&1; then
        error "Health check failed after deployment"
    fi
    
    log "Deployment completed successfully"
}

# Rollback function
rollback() {
    log "Rolling back to previous version..."
    
    cd "$APP_DIR"
    
    # Stop current services
    docker-compose -f docker-compose.prod.yml down
    
    # Restore from backup
    latest_backup=$(ls -t "$BACKUP_DIR"/*.tar.gz | head -n1)
    if [[ -f "$latest_backup" ]]; then
        tar -xzf "$latest_backup" -C "$APP_DIR"
        docker-compose -f docker-compose.prod.yml up -d
        log "Rollback completed"
    else
        error "No backup found for rollback"
    fi
}

# Main deployment process
main() {
    log "Starting WorkHub deployment process..."
    
    # Load environment variables
    if [[ -f "$APP_DIR/.env" ]]; then
        source "$APP_DIR/.env"
    else
        error "Environment file not found at $APP_DIR/.env"
    fi
    
    # Create backup before deployment
    create_backup
    
    # Deploy application
    deploy
    
    # Clean up old Docker images
    log "Cleaning up old Docker images..."
    docker image prune -f
    
    log "Deployment process completed successfully!"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "rollback")
        rollback
        ;;
    "backup")
        create_backup
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|backup}"
        exit 1
        ;;
esac
