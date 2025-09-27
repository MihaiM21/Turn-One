#!/bin/bash

# Turn One - CI/CD Deployment Helper
# This script is called by GitHub Actions to deploy to VPS

set -e

# Configuration (set these as GitHub Secrets)
VPS_HOST="${VPS_HOST}"
VPS_USER="${VPS_USER}" 
VPS_SSH_KEY="${VPS_SSH_KEY}"
DEPLOYMENT_PATH="${DEPLOYMENT_PATH:-/tmp/turn-one-deployment}"

# Function to deploy to VPS
deploy_to_vps() {
    local environment=$1
    local deployment_package=$2
    local domain=$3
    
    echo "🚀 Deploying to $environment VPS..."
    echo "Domain: $domain"
    echo "Package: $deployment_package"
    
    # Create SSH key file
    echo "$VPS_SSH_KEY" > /tmp/ssh_key
    chmod 600 /tmp/ssh_key
    
    # Copy deployment package to VPS
    echo "📦 Uploading deployment package..."
    scp -i /tmp/ssh_key -o StrictHostKeyChecking=no \
        "$deployment_package" \
        "$VPS_USER@$VPS_HOST:$DEPLOYMENT_PATH/"
    
    # Run deployment script on VPS
    echo "🔄 Running deployment script..."
    ssh -i /tmp/ssh_key -o StrictHostKeyChecking=no \
        "$VPS_USER@$VPS_HOST" \
        "sudo /app/scripts/deploy.sh $DEPLOYMENT_PATH/$(basename $deployment_package)"
    
    # Cleanup SSH key
    rm -f /tmp/ssh_key
    
    echo "✅ Deployment to $environment completed!"
}

# Function to run health checks
health_check() {
    local environment=$1
    local base_url=""
    
    case $environment in
        "staging")
            base_url="https://staging.turnone.com"
            ;;
        "production")
            base_url="https://turnone.com"
            ;;
        *)
            echo "❌ Unknown environment: $environment"
            return 1
            ;;
    esac
    
    echo "🏥 Running health checks for $environment..."
    
    # Wait a bit for services to fully start
    sleep 30
    
    # Check API health
    if curl -f -s "$base_url/health" > /dev/null; then
        echo "✅ API health check passed"
    else
        echo "❌ API health check failed"
        return 1
    fi
    
    # Check Client health  
    if curl -f -s "$base_url/api/health" > /dev/null; then
        echo "✅ Client health check passed"
    else
        echo "❌ Client health check failed"
        return 1
    fi
    
    echo "✅ All health checks passed for $environment!"
    return 0
}

# Main function
main() {
    local environment=${1:-"staging"}
    local deployment_package=${2:-""}
    local domain=${3:-""}
    
    if [ -z "$deployment_package" ]; then
        echo "❌ Deployment package not specified"
        exit 1
    fi
    
    if [ -z "$domain" ]; then
        echo "❌ Domain not specified"
        exit 1
    fi
    
    if [ ! -f "$deployment_package" ]; then
        echo "❌ Deployment package not found: $deployment_package"
        exit 1
    fi
    
    # Deploy to VPS
    deploy_to_vps "$environment" "$deployment_package" "$domain"
    
    # Run health checks
    if health_check "$environment"; then
        echo "🎉 Deployment to $environment successful!"
        exit 0
    else
        echo "💥 Health checks failed for $environment"
        exit 1
    fi
}

# Run main function
main "$@"