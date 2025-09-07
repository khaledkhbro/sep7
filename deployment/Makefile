# WorkHub VPS Deployment Makefile

.PHONY: help setup deploy rollback backup logs status clean

# Default target
help:
	@echo "WorkHub VPS Deployment Commands:"
	@echo "  setup     - Initial VPS setup (run as root)"
	@echo "  deploy    - Deploy application"
	@echo "  rollback  - Rollback to previous version"
	@echo "  backup    - Create backup"
	@echo "  logs      - View application logs"
	@echo "  status    - Check service status"
	@echo "  clean     - Clean up old Docker images"

# Initial VPS setup
setup:
	@echo "Setting up VPS for WorkHub..."
	sudo ./scripts/setup-vps.sh

# Deploy application
deploy:
	@echo "Deploying WorkHub..."
	./scripts/deploy.sh deploy

# Rollback deployment
rollback:
	@echo "Rolling back WorkHub..."
	./scripts/deploy.sh rollback

# Create backup
backup:
	@echo "Creating backup..."
	./scripts/deploy.sh backup

# View logs
logs:
	@echo "Viewing application logs..."
	docker-compose -f docker-compose.prod.yml logs -f --tail=100

# Check service status
status:
	@echo "Checking service status..."
	systemctl status workhub
	docker-compose -f docker-compose.prod.yml ps
	curl -f http://localhost/health && echo "✓ Health check passed" || echo "✗ Health check failed"

# Clean up old Docker images
clean:
	@echo "Cleaning up old Docker images..."
	docker image prune -f
	docker volume prune -f
