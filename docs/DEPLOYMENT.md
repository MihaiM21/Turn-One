# 🚀 Turn One VPS Deployment Guide

This guide explains how to set up and deploy Turn One on your VPS using Docker Compose.

## 📋 Prerequisites

- Ubuntu 20.04+ VPS
- Root or sudo access
- Domain name (optional but recommended)
- GitHub repository access

## 🔧 VPS Setup

### 1. Initial VPS Setup

Run this command on your VPS to set up all necessary components:

```bash
# Download and run the setup script
curl -fsSL https://raw.githubusercontent.com/MihaiM21/Turn-One/master/scripts/setup-vps.sh | bash
```

Or manually:

```bash
# Clone the repository
git clone https://github.com/MihaiM21/Turn-One.git
cd Turn-One

# Make setup script executable and run it
chmod +x scripts/setup-vps.sh
./scripts/setup-vps.sh
```

### 2. Copy Deployment Scripts

```bash
# Copy deployment script to the correct location
sudo cp scripts/deploy.sh /app/scripts/
sudo chmod +x /app/scripts/deploy.sh
sudo chown deploy:deploy /app/scripts/deploy.sh
```

### 3. Configure Domain (Optional)

Update the Nginx configuration with your domain:

```bash
sudo nano /etc/nginx/sites-available/turn-one
# Replace 'your-domain.com' with your actual domain

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 4. Setup SSL Certificate (Optional)

```bash
# Install SSL certificate with Let's Encrypt
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

## 🔑 GitHub Actions Setup

### 1. Create GitHub Secrets

In your GitHub repository, go to Settings > Secrets and Variables > Actions, and add:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `VPS_HOST` | Your VPS IP address | `192.168.1.100` |
| `VPS_USER` | VPS deployment user | `deploy` |
| `VPS_SSH_KEY` | Private SSH key for deployment | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `DEPLOYMENT_PATH` | Temporary deployment path | `/tmp/turn-one-deployment` |

### 2. Setup SSH Key

On your local machine:

```bash
# Generate SSH key pair
ssh-keygen -t ed25519 -C "github-actions@turnone.com" -f ~/.ssh/turn-one-deploy

# Copy public key to VPS
ssh-copy-id -i ~/.ssh/turn-one-deploy.pub deploy@your-vps-ip

# Add private key content to GitHub Secrets as VPS_SSH_KEY
cat ~/.ssh/turn-one-deploy
```

### 3. Update Pipeline Configuration

In `.github/workflows/pipeline.yml`, uncomment the deployment lines:

```yaml
# Uncomment these lines in deploy-staging and deploy-production jobs:
# ./scripts/deploy-vps.sh staging deployment-package-${{ needs.build-and-test.outputs.version }}.tar.gz
# ./scripts/deploy-vps.sh production deployment-package-${{ needs.build-and-test.outputs.version }}.tar.gz
```

## 🎯 Deployment Process

The pipeline automatically:

1. **Security Scan** - Checks for vulnerabilities
2. **Code Quality** - Runs linting and type checking  
3. **Build & Test** - Builds both API and client
4. **Version Update** - Increments version automatically
5. **Deploy Staging** - Deploys to staging environment
6. **Deploy Production** - Deploys to production (with approval)

### Manual Deployment

You can also deploy manually:

```bash
# On your VPS
sudo /app/scripts/deploy.sh /path/to/deployment-package.tar.gz
```

## 📊 Monitoring & Health Checks

### Health Endpoints

- **API Health**: `https://your-domain.com/health`
- **Client Health**: `https://your-domain.com/api/health`

### Log Files

```bash
# Deployment logs
sudo tail -f /var/log/turn-one-deploy.log

# Application logs
sudo docker-compose -f /app/turn-one/current/docker-compose.yml logs -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Docker Management

```bash
# View running containers
docker ps

# View application logs
cd /app/turn-one/current
docker-compose logs -f

# Restart services
docker-compose restart

# Update and rebuild
docker-compose down
docker-compose up -d --build
```

## 🔄 Rollback Process

If deployment fails, the system automatically rolls back to the previous version. For manual rollback:

```bash
# List available backups
ls -la /app/backups/

# Manual rollback (replace with actual backup name)
sudo rm -rf /app/turn-one/current
sudo cp -r /app/backups/backup-20231225-143000 /app/turn-one/current
cd /app/turn-one/current
sudo docker-compose up -d
```

## 🛡️ Security Features

### Automatic Backups
- Creates backup before each deployment
- Keeps last 5 backups automatically
- Stored in `/app/backups/`

### Health Checks
- API and client health verification
- Automatic rollback on health check failure
- 10 retry attempts with 10-second intervals

### Container Security
- Non-root container execution
- Minimal attack surface
- Regular security updates

### Firewall Configuration
- SSH (22), HTTP (80), HTTPS (443)
- Application ports (3000, 5000)
- Default deny incoming policy

## 🔧 Troubleshooting

### Common Issues

**Deployment Fails:**
```bash
# Check deployment logs
sudo tail -f /var/log/turn-one-deploy.log

# Check Docker status
docker ps -a
docker-compose logs
```

**Health Checks Fail:**
```bash
# Test endpoints manually
curl -I http://localhost:5000/health
curl -I http://localhost:3000/api/health

# Check container status
docker-compose ps
```

**Permission Issues:**
```bash
# Fix ownership
sudo chown -R deploy:deploy /app/turn-one
sudo chmod -R 755 /app/scripts
```

### Service Management

```bash
# Start services
sudo systemctl start nginx docker

# Enable services (start on boot)
sudo systemctl enable nginx docker

# Check service status
sudo systemctl status nginx docker
```

## 📈 Performance Optimization

### Docker Cleanup

```bash
# Clean up old images and containers (runs automatically after deployment)
docker system prune -f
docker image prune -f
docker container prune -f
```

### Log Rotation

Log rotation is configured automatically for:
- Deployment logs (30 days retention)
- Application logs (7 days retention)
- Nginx logs (managed by system)

## 🎉 Success!

Once set up, your Turn One application will be:

- ✅ **Automatically deployed** on every push to master
- ✅ **Monitored** with health checks
- ✅ **Backed up** before each deployment  
- ✅ **Secured** with SSL and firewall
- ✅ **Scalable** with Docker containers
- ✅ **Maintainable** with logging and monitoring

Your Turn One Formula 1 platform is now running enterprise-grade deployment! 🏎️