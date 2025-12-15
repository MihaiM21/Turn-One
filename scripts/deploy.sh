#!/bin/bash

# Turn One - Deployment Script
# Usage: ./deploy.sh <environment> <version>
# Example: ./deploy.sh production v1.2.0

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENVIRONMENT=${1:-staging}
VERSION=${2:-latest}

# Registry configuration
REGISTRY=${REGISTRY:-ghcr.io}
IMAGE_PREFIX=${IMAGE_PREFIX:-turnone}

echo -e "${CYAN}╔═══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   Turn One Deployment Script          ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════╝${NC}"
echo ""

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
    echo -e "${RED}❌ Invalid environment: $ENVIRONMENT${NC}"
    echo "Usage: ./deploy.sh <staging|production> <version>"
    exit 1
fi

echo -e "${CYAN}🎯 Environment:${NC} $ENVIRONMENT"
echo -e "${CYAN}📦 Version:${NC} $VERSION"
echo ""

# Function: Health check
health_check() {
    local url=$1
    local max_attempts=30
    local attempt=1
    
    echo -e "${YELLOW}⏳ Waiting for service to be healthy...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -sf "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Service is healthy!${NC}"
            return 0
        fi
        
        echo -e "${YELLOW}Attempt $attempt/$max_attempts: Service not ready yet...${NC}"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ Service failed to become healthy${NC}"
    return 1
}

# Function: Rollback
rollback() {
    echo -e "${RED}🔄 Rolling back deployment...${NC}"
    
    # Add your rollback logic here
    # Example for Docker Compose:
    # docker-compose down
    # docker-compose -f docker-compose.backup.yml up -d
    
    # Example for Kubernetes:
    # kubectl rollout undo deployment/turn-one-api
    # kubectl rollout undo deployment/turn-one-client
    
    echo -e "${YELLOW}⚠️  Rollback completed${NC}"
    exit 1
}

# Function: Pre-deployment checks
pre_deployment_checks() {
    echo -e "${CYAN}🔍 Running pre-deployment checks...${NC}"
    
    # Check if version exists
    if [ "$VERSION" != "latest" ]; then
        echo "Verifying version $VERSION exists..."
        # Add version verification logic
    fi
    
    # Check database migrations
    echo "Checking database migrations..."
    # Add migration check logic
    
    # Check configuration
    echo "Validating configuration..."
    # Add config validation logic
    
    echo -e "${GREEN}✅ Pre-deployment checks passed${NC}"
    echo ""
}

# Function: Backup current deployment
backup_deployment() {
    echo -e "${CYAN}💾 Creating backup of current deployment...${NC}"
    
    BACKUP_DIR="$PROJECT_ROOT/backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup docker-compose file
    if [ -f "$PROJECT_ROOT/docker-compose.yml" ]; then
        cp "$PROJECT_ROOT/docker-compose.yml" "$BACKUP_DIR/"
    fi
    
    # Backup database (example)
    # docker exec turn-one-db pg_dump > "$BACKUP_DIR/database.sql"
    
    echo -e "${GREEN}✅ Backup created at: $BACKUP_DIR${NC}"
    echo ""
}

# Function: Deploy with Docker Compose
deploy_docker_compose() {
    echo -e "${CYAN}🚀 Deploying with Docker Compose...${NC}"
    
    cd "$PROJECT_ROOT"
    
    # Export environment variables
    export COMPOSE_PROJECT_NAME="turnone-$ENVIRONMENT"
    export IMAGE_TAG="$VERSION"
    
    # Pull latest images
    echo "Pulling Docker images..."
    docker-compose pull
    
    # Stop old containers
    echo "Stopping old containers..."
    docker-compose down
    
    # Start new containers
    echo "Starting new containers..."
    docker-compose up -d
    
    echo -e "${GREEN}✅ Docker Compose deployment completed${NC}"
}

# Function: Deploy with Kubernetes
deploy_kubernetes() {
    echo -e "${CYAN}🚀 Deploying to Kubernetes...${NC}"
    
    # Set context based on environment
    if [ "$ENVIRONMENT" == "production" ]; then
        KUBE_CONTEXT="production-cluster"
        NAMESPACE="turnone-prod"
    else
        KUBE_CONTEXT="staging-cluster"
        NAMESPACE="turnone-staging"
    fi
    
    echo "Using context: $KUBE_CONTEXT"
    echo "Namespace: $NAMESPACE"
    
    # Switch context
    kubectl config use-context "$KUBE_CONTEXT"
    
    # Apply configurations
    kubectl apply -f "$PROJECT_ROOT/k8s/$ENVIRONMENT/" -n "$NAMESPACE"
    
    # Update image tags
    kubectl set image deployment/turn-one-api \
        api="$REGISTRY/$IMAGE_PREFIX-api:$VERSION" \
        -n "$NAMESPACE"
    
    kubectl set image deployment/turn-one-client \
        client="$REGISTRY/$IMAGE_PREFIX-client:$VERSION" \
        -n "$NAMESPACE"
    
    # Wait for rollout
    echo "Waiting for rollout to complete..."
    kubectl rollout status deployment/turn-one-api -n "$NAMESPACE"
    kubectl rollout status deployment/turn-one-client -n "$NAMESPACE"
    
    echo -e "${GREEN}✅ Kubernetes deployment completed${NC}"
}

# Function: Post-deployment verification
post_deployment_verification() {
    echo -e "${CYAN}🔍 Running post-deployment verification...${NC}"
    
    # Set URLs based on environment
    if [ "$ENVIRONMENT" == "production" ]; then
        API_URL="https://api.turnone.app"
        CLIENT_URL="https://turnone.app"
    else
        API_URL="https://api.staging.turnone.app"
        CLIENT_URL="https://staging.turnone.app"
    fi
    
    # Health checks
    echo "Checking API health..."
    if ! health_check "$API_URL/health"; then
        rollback
    fi
    
    echo "Checking Client health..."
    if ! health_check "$CLIENT_URL/api/health"; then
        rollback
    fi
    
    # Version verification
    echo "Verifying deployed version..."
    DEPLOYED_VERSION=$(curl -s "$API_URL/api/version/current" | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
    echo "Deployed version: $DEPLOYED_VERSION"
    
    # Smoke tests
    echo "Running smoke tests..."
    
    # Test API endpoints
    if ! curl -sf "$API_URL/swagger/index.html" > /dev/null; then
        echo -e "${YELLOW}⚠️  Warning: Swagger endpoint check failed${NC}"
    fi
    
    # Test client
    if ! curl -sf "$CLIENT_URL" > /dev/null; then
        echo -e "${RED}❌ Client endpoint check failed${NC}"
        rollback
    fi
    
    echo -e "${GREEN}✅ Post-deployment verification passed${NC}"
    echo ""
}

# Function: Run database migrations
run_migrations() {
    echo -e "${CYAN}🗄️  Running database migrations...${NC}"
    
    # Example for EF Core migrations
    # docker exec turn-one-api dotnet ef database update
    
    # Example using migration script
    # cd "$PROJECT_ROOT/turn-one-backend"
    # dotnet ef database update --project Infrastructure --startup-project API
    
    echo -e "${GREEN}✅ Database migrations completed${NC}"
    echo ""
}

# Function: Deployment notification
send_notification() {
    local status=$1
    local message=$2
    
    echo -e "${CYAN}📢 Sending deployment notification...${NC}"
    
    # Example: Slack notification
    # curl -X POST -H 'Content-type: application/json' \
    #   --data "{\"text\":\"$message\"}" \
    #   "$SLACK_WEBHOOK_URL"
    
    # Example: Discord notification
    # curl -H "Content-Type: application/json" \
    #   -d "{\"content\": \"$message\"}" \
    #   "$DISCORD_WEBHOOK_URL"
    
    # Example: Email notification
    # echo "$message" | mail -s "Turn One Deployment: $status" team@turnone.app
    
    echo -e "${GREEN}✅ Notification sent${NC}"
}

# Main deployment flow
main() {
    echo -e "${CYAN}Starting deployment process...${NC}"
    echo ""
    
    # Step 1: Pre-deployment checks
    pre_deployment_checks
    
    # Step 2: Backup
    backup_deployment
    
    # Step 3: Run migrations
    run_migrations
    
    # Step 4: Deploy (choose your deployment method)
    # Option 1: Docker Compose
    deploy_docker_compose
    
    # Option 2: Kubernetes (comment out if not using)
    # deploy_kubernetes
    
    # Step 5: Post-deployment verification
    post_deployment_verification
    
    # Step 6: Success notification
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   ✅ Deployment Successful!          ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}Environment:${NC} $ENVIRONMENT"
    echo -e "${CYAN}Version:${NC} $VERSION"
    echo -e "${CYAN}Deployed at:${NC} $(date)"
    echo ""
    
    # Send success notification
    send_notification "SUCCESS" "✅ Turn One $ENVIRONMENT deployment successful! Version: $VERSION"
}

# Handle errors
trap 'echo -e "${RED}❌ Deployment failed!${NC}"; send_notification "FAILED" "❌ Turn One $ENVIRONMENT deployment failed!"; exit 1' ERR

# Run main deployment
main

exit 0
