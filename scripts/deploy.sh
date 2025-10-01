#!/bin/bash

# Turn One - VPS Deployment Script
# This script handles deployment on your VPS server

set -e  # Exit on any error

# Configuration
APP_DIR="/app/turn-one"
BACKUP_DIR="/app/backups"
LOG_FILE="/var/log/turn-one-deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a $LOG_FILE
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a $LOG_FILE
}

# Function to create backup
create_backup() {
    if [ -d "$APP_DIR/current" ]; then
        local backup_name="backup-$(date +%Y%m%d-%H%M%S)"
        log "Creating backup: $backup_name"
        mkdir -p $BACKUP_DIR
        cp -r $APP_DIR/current $BACKUP_DIR/$backup_name
        log "Backup created successfully"
        
        # Keep only last 5 backups
        cd $BACKUP_DIR
        ls -t | tail -n +6 | xargs -r rm -rf
        log "Old backups cleaned up"
    else
        log "No existing deployment found, skipping backup"
    fi
}

# Function to deploy application
deploy() {
    local deployment_package=$1
    
    if [ ! -f "$deployment_package" ]; then
        error "Deployment package not found: $deployment_package"
        exit 1
    fi
    
    log "Starting deployment from: $deployment_package"
    
    # Create backup
    create_backup
    
    # Stop current services
    if [ -d "$APP_DIR/current" ]; then
        log "Stopping current services..."
        cd $APP_DIR/current
        docker-compose down --remove-orphans || warn "Failed to stop some services"
    fi
    
    # Extract new deployment
    log "Extracting new deployment..."
    mkdir -p $APP_DIR/staging
    cd $APP_DIR/staging
    tar -xzf $deployment_package
    
    # Move to current
    log "Switching to new deployment..."
    cd $APP_DIR
    rm -rf current
    mv staging current
    cd current
    
    # Build and start services
    log "Building and starting services..."
    docker-compose build --no-cache
    docker-compose up -d
    
    # Wait for services to start
    log "Waiting for services to start..."
    sleep 30
    
    # Health checks
    log "Running health checks..."
    if health_check; then
        log "✅ Deployment successful!"
        cleanup_old_images
        return 0
    else
        error "❌ Health checks failed!"
        rollback
        return 1
    fi
}

# Function to perform health checks
health_check() {
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log "Health check attempt $attempt/$max_attempts"
        
        # Check API health
        if curl -f -s http://localhost:5000/health > /dev/null 2>&1; then
            log "✅ API health check passed"
            
            # Check Client health
            if curl -f -s http://localhost:3000/api/health > /dev/null 2>&1; then
                log "✅ Client health check passed"
                return 0
            else
                warn "❌ Client health check failed"
            fi
        else
            warn "❌ API health check failed"
        fi
        
        sleep 10
        ((attempt++))
    done
    
    error "Health checks failed after $max_attempts attempts"
    return 1
}

# Function to rollback deployment
rollback() {
    error "Rolling back deployment..."
    
    # Stop current services
    cd $APP_DIR/current
    docker-compose down --remove-orphans
    
    # Find latest backup
    local latest_backup=$(ls -t $BACKUP_DIR | head -n 1)
    
    if [ -n "$latest_backup" ] && [ -d "$BACKUP_DIR/$latest_backup" ]; then
        log "Rolling back to: $latest_backup"
        
        # Restore from backup
        cd $APP_DIR
        rm -rf current
        cp -r $BACKUP_DIR/$latest_backup current
        cd current
        
        # Start previous version
        docker-compose up -d
        
        if health_check; then
            log "✅ Rollback successful"
        else
            error "❌ Rollback failed - manual intervention required"
        fi
    else
        error "No backup found for rollback"
    fi
}

# Function to cleanup old Docker images
cleanup_old_images() {
    log "Cleaning up old Docker images..."
    docker image prune -f
    docker container prune -f
    log "Docker cleanup completed"
}

# Main deployment function
main() {
    local deployment_package=${1:-""}
    
    if [ -z "$deployment_package" ]; then
        error "Usage: $0 <deployment-package.tar.gz>"
        error "Example: $0 /tmp/deployment-package-1.0.1.tar.gz"
        exit 1
    fi
    
    log "=== Turn One Deployment Started ==="
    log "Deployment package: $deployment_package"
    log "Target directory: $APP_DIR"
    
    # Create necessary directories
    mkdir -p $APP_DIR $BACKUP_DIR $(dirname $LOG_FILE)
    
    # Deploy
    if deploy "$deployment_package"; then
        log "=== Deployment Completed Successfully ==="
        exit 0
    else
        error "=== Deployment Failed ==="
        exit 1
    fi
}

# Run main function with all arguments
main "$@"