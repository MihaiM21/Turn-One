#!/bin/bash

# Turn One - VPS Setup Script
# Run this script on your VPS to prepare it for deployments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Function to install Docker
install_docker() {
    log "Installing Docker..."
    
    # Update package index
    sudo apt-get update
    
    # Install packages to allow apt to use a repository over HTTPS
    sudo apt-get install -y \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Add Docker's official GPG key
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    # Set up the repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Update package index
    sudo apt-get update
    
    # Install Docker Engine
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    
    log "✅ Docker installed successfully"
}

# Function to install Docker Compose (standalone)
install_docker_compose() {
    log "Installing Docker Compose..."
    
    # Download and install Docker Compose
    DOCKER_COMPOSE_VERSION="v2.23.3"
    sudo curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    
    # Make it executable
    sudo chmod +x /usr/local/bin/docker-compose
    
    # Create symbolic link
    sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    log "✅ Docker Compose installed successfully"
}

# Function to setup directories
setup_directories() {
    log "Setting up application directories..."
    
    # Create application directories
    sudo mkdir -p /app/turn-one/{current,staging}
    sudo mkdir -p /app/backups
    sudo mkdir -p /app/scripts
    sudo mkdir -p /var/log
    
    # Set permissions
    sudo chown -R $USER:$USER /app
    sudo chmod -R 755 /app
    
    log "✅ Directories created successfully"
}

# Function to setup firewall
setup_firewall() {
    log "Configuring firewall..."
    
    # Install ufw if not installed
    sudo apt-get install -y ufw
    
    # Reset firewall rules
    sudo ufw --force reset
    
    # Default policies
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    
    # Allow SSH
    sudo ufw allow ssh
    
    # Allow HTTP and HTTPS
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    
    # Allow application ports (adjust as needed)
    sudo ufw allow 3000/tcp  # Next.js
    sudo ufw allow 5000/tcp  # .NET API
    
    # Enable firewall
    sudo ufw --force enable
    
    log "✅ Firewall configured successfully"
}

# Function to install system dependencies
install_system_deps() {
    log "Installing system dependencies..."
    
    sudo apt-get update
    sudo apt-get install -y \
        curl \
        wget \
        git \
        unzip \
        tar \
        jq \
        htop \
        nginx \
        certbot \
        python3-certbot-nginx
    
    log "✅ System dependencies installed successfully"
}

# Function to setup nginx
setup_nginx() {
    log "Setting up Nginx..."
    
    # Create nginx configuration for Turn One
    sudo tee /etc/nginx/sites-available/turn-one > /dev/null <<EOF
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Redirect all HTTP traffic to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL configuration (will be handled by Certbot)
    # ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # API proxy
    location /api/ {
        proxy_pass http://localhost:5000/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Health check proxy
    location /health {
        proxy_pass http://localhost:5000/health;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
    
    # Client application
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
    
    # Enable the site
    sudo ln -sf /etc/nginx/sites-available/turn-one /etc/nginx/sites-enabled/
    
    # Remove default site
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test nginx configuration
    sudo nginx -t
    
    # Start and enable nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
    
    log "✅ Nginx configured successfully"
    warn "Remember to update the server_name in /etc/nginx/sites-available/turn-one with your actual domain"
}

# Function to setup log rotation
setup_logrotate() {
    log "Setting up log rotation..."
    
    sudo tee /etc/logrotate.d/turn-one > /dev/null <<EOF
/var/log/turn-one-deploy.log {
    daily
    missingok
    rotate 30
    compress
    notifempty
    create 644 $USER $USER
}

/app/turn-one/current/*.log {
    daily
    missingok
    rotate 7
    compress
    notifempty
    copytruncate
}
EOF
    
    log "✅ Log rotation configured successfully"
}

# Function to create deployment user
setup_deployment_user() {
    log "Setting up deployment user..."
    
    # Create deployment user if it doesn't exist
    if ! id "deploy" &>/dev/null; then
        sudo useradd -m -s /bin/bash deploy
        sudo usermod -aG docker deploy
        sudo usermod -aG sudo deploy
        
        # Set up SSH directory
        sudo -u deploy mkdir -p /home/deploy/.ssh
        sudo -u deploy chmod 700 /home/deploy/.ssh
        
        log "✅ Deployment user 'deploy' created"
        warn "Remember to add your CI/CD public key to /home/deploy/.ssh/authorized_keys"
    else
        log "Deployment user 'deploy' already exists"
    fi
}

# Main setup function
main() {
    log "=== Turn One VPS Setup Started ==="
    
    # Check if running as root
    if [ "$EUID" -eq 0 ]; then
        error "Please don't run this script as root. Use a sudo-enabled user instead."
        exit 1
    fi
    
    # Update system first
    log "Updating system packages..."
    sudo apt-get update && sudo apt-get upgrade -y
    
    # Install components
    install_system_deps
    install_docker
    install_docker_compose
    setup_directories
    setup_deployment_user
    setup_firewall
    setup_nginx
    setup_logrotate
    
    log "=== Turn One VPS Setup Completed ==="
    log ""
    log "Next steps:"
    log "1. Update /etc/nginx/sites-available/turn-one with your domain name"
    log "2. Add your CI/CD public key to /home/deploy/.ssh/authorized_keys"
    log "3. Copy deploy.sh script to /app/scripts/ and make it executable"
    log "4. Setup SSL certificate with: sudo certbot --nginx -d your-domain.com"
    log "5. Restart nginx: sudo systemctl restart nginx"
    log ""
    log "You may need to log out and back in for Docker group membership to take effect"
}

# Run main function
main "$@"