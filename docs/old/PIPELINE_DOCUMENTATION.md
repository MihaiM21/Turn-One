# Enterprise CI/CD Pipeline Documentation

## 🏎️ Turn One Formula 1 Platform - Pipeline Architecture

This document describes the enterprise-grade CI/CD pipeline for the Turn One application.

## 📋 Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ENTERPRISE CI/CD PIPELINE                             │
└─────────────────────────────────────────────────────────────────────────┘

STAGE 1: Security & Quality (Parallel)
├─ 🔒 Security Scanning
│  ├─ Trivy filesystem scan
│  ├─ npm audit
│  └─ Upload to GitHub Security
│
└─ 📊 Code Quality
   ├─ ESLint (Frontend)
   ├─ TypeScript type checking
   ├─ .NET format verification
   └─ .NET code analysis

STAGE 2: Build & Test (Parallel)
├─ 🏗️ Backend Build (.NET 9)
│  ├─ Restore dependencies
│  ├─ Build solution
│  ├─ Run unit tests
│  ├─ Code coverage
│  └─ Publish artifacts
│
└─ 🎨 Frontend Build (Next.js 15)
   ├─ Install dependencies
   ├─ Build application
   ├─ Type checking
   └─ Upload artifacts

STAGE 3: Docker Build (Parallel)
├─ 🐳 API Docker Image
│  ├─ Build multi-stage image
│  ├─ Trivy container scan
│  ├─ Push to registry
│  └─ Tag with version
│
└─ 🐳 Client Docker Image
   ├─ Build multi-stage image
   ├─ Trivy container scan
   ├─ Push to registry
   └─ Tag with version

STAGE 4: Integration Tests
└─ 🧪 Full Stack Testing
   ├─ Start services (Docker Compose)
   ├─ Health checks
   ├─ API smoke tests
   ├─ Client smoke tests
   └─ Cleanup

STAGE 5: Performance Tests (Main branch only)
└─ ⚡ Load Testing
   ├─ Start services
   ├─ k6 load tests
   ├─ Performance metrics
   └─ Cleanup

STAGE 6: Deployment
├─ 🚀 Staging (dev branch)
│  ├─ Deploy to staging
│  ├─ Health checks
│  └─ Smoke tests
│
└─ 🎯 Production (master/main branch)
   ├─ Deploy to production
   ├─ Health checks
   ├─ Create deployment record
   └─ 📢 Notifications
```

## 🎯 Pipeline Features

### ✅ Security First
- **Trivy Scanning**: Filesystem and container vulnerability scanning
- **SARIF Reports**: Integrated with GitHub Security tab
- **npm Audit**: Frontend dependency security checks
- **Non-root Containers**: Security best practices enforced

### ✅ Code Quality
- **ESLint**: Frontend code linting with auto-fix
- **TypeScript**: Strict type checking
- **.NET Analyzers**: Code quality and style enforcement
- **Format Verification**: Consistent code formatting

### ✅ Comprehensive Testing
- **Unit Tests**: Backend test suite with coverage
- **Integration Tests**: Full-stack end-to-end testing
- **Performance Tests**: Load testing with k6
- **Health Checks**: Service readiness validation

### ✅ Advanced Docker
- **Multi-stage Builds**: Optimized image sizes
- **Layer Caching**: Fast builds with GitHub Actions cache
- **Multi-arch Support**: Ready for ARM64/AMD64
- **Security Scanning**: Container vulnerability detection

### ✅ Smart Deployments
- **Environment-based**: Staging and Production environments
- **Health Checks**: Post-deployment validation
- **Rollback Ready**: Failed health checks prevent deployment
- **Version Tracking**: Deployment records in GitHub

### ✅ Performance & Efficiency
- **Parallel Jobs**: Maximum concurrency for speed
- **Smart Caching**: npm and Docker layer caching
- **Concurrency Control**: Cancel outdated runs
- **Artifact Management**: Efficient artifact storage

## 🚦 Trigger Conditions

### Automatic Triggers

| Event | Branches | Jobs Executed |
|-------|----------|---------------|
| Push | `master`, `main`, `dev` | All jobs + deployment |
| Pull Request | `master`, `main` | All jobs except deployment |
| Tag Push | `v*` | All jobs + production deployment |
| Manual | Any | All jobs (workflow_dispatch) |

### Deployment Triggers

| Environment | Condition | Approval Required |
|-------------|-----------|-------------------|
| **Staging** | Push to `dev` branch | ❌ No |
| **Production** | Push to `master`/`main` or tag `v*` | ✅ Yes (via environment protection) |

## 📊 Pipeline Stages Breakdown

### Stage 1: Security & Quality (5-8 minutes)

**Security Scanning Job:**
```yaml
- Trivy filesystem scan (CRITICAL, HIGH, MEDIUM)
- npm audit with JSON report
- Upload SARIF to GitHub Security
- Artifact retention: 30 days
```

**Code Quality Job:**
```yaml
- Frontend: ESLint + TypeScript type check
- Backend: .NET format check + code analysis
- Continues on non-critical errors
```

### Stage 2: Build & Test (8-12 minutes)

**Backend Build:**
```yaml
- .NET 9 SDK setup
- Restore + Build (Release config)
- Run unit tests with coverage
- Generate test reports (TRX format)
- Publish artifacts for deployment
```

**Frontend Build:**
```yaml
- Node.js 20 setup
- npm ci (clean install)
- Next.js production build
- Upload .next build artifacts
```

### Stage 3: Docker Build (10-15 minutes)

**Matrix Strategy:** Builds `api` and `client` in parallel

```yaml
For each service:
  - Multi-stage Docker build
  - Tag with: branch, PR, semver, SHA, latest
  - Trivy container scan (CRITICAL, HIGH)
  - Push to GitHub Container Registry
  - Cache optimization
```

**Image Tags Generated:**
- `ghcr.io/owner/repo-api:main`
- `ghcr.io/owner/repo-api:latest`
- `ghcr.io/owner/repo-api:sha-abc123`
- `ghcr.io/owner/repo-api:v1.2.0` (on tag)

### Stage 4: Integration Tests (5-8 minutes)

```yaml
1. Start services via docker-compose
2. Wait for healthy status (120s timeout)
3. API health check: /health
4. Client health check: /api/health
5. Swagger UI test: /swagger/index.html
6. Show logs on failure
7. Cleanup containers
```

### Stage 5: Performance Tests (3-5 minutes)

**k6 Load Testing:**
```javascript
- Ramp up: 30s to 20 users
- Sustained load: 1m at 20 users
- Ramp down: 30s to 0 users

Thresholds:
- 95th percentile: < 500ms
- Error rate: < 5%
```

### Stage 6: Deployment (Variable)

**Staging:**
- Automatic on `dev` branch push
- No manual approval required
- Health checks after deployment
- URL: https://staging.turnone.app

**Production:**
- Triggered by `master`/`main` push or version tag
- **Manual approval required** (GitHub environment protection)
- Health checks after deployment
- Deployment record created
- URL: https://turnone.app

## 🔐 Security Features

### SARIF Integration
All security scans upload SARIF files to GitHub Security tab:
```
Security → Code scanning alerts
- Trivy filesystem vulnerabilities
- Trivy container vulnerabilities (per service)
- Categorized by severity
```

### Container Security
```dockerfile
✅ Non-root user (appuser)
✅ Minimal base images (Alpine)
✅ Multi-stage builds
✅ Read-only filesystem where possible
✅ Version tracking
```

### Dependency Management
```
- Automated npm audit
- Dependabot integration (recommended)
- Regular security updates
```

## 📦 Artifact Management

### Build Artifacts
| Artifact | Retention | Size (approx) |
|----------|-----------|---------------|
| `security-reports` | 30 days | < 1 MB |
| `backend-test-results` | 30 days | < 5 MB |
| `backend-app` | 7 days | 50-100 MB |
| `frontend-app` | 7 days | 100-200 MB |

### Docker Images
- Stored in GitHub Container Registry (ghcr.io)
- Tagged with version, branch, SHA
- Retention: Manual cleanup required

## 🎨 Customization Points

### Environment Variables

Add to workflow file or GitHub Secrets:

```yaml
# API Configuration
API_URL: https://api.turnone.app
DATABASE_URL: postgresql://...

# Authentication
JWT_SECRET: ${{ secrets.JWT_SECRET }}
API_KEY: ${{ secrets.API_KEY }}

# External Services
REDIS_URL: ${{ secrets.REDIS_URL }}
SMTP_HOST: ${{ secrets.SMTP_HOST }}
```

### Custom Deployment Commands

**For Staging (line ~420):**
```yaml
- name: Deploy to staging
  run: |
    # Example: Kubernetes
    kubectl set image deployment/turn-one-api api=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-api:${{ github.sha }}
    kubectl rollout status deployment/turn-one-api
    
    # Example: Docker Swarm
    docker stack deploy -c docker-compose.staging.yml turnone-staging
    
    # Example: SSH Deploy
    ssh user@staging.server 'cd /app && docker-compose pull && docker-compose up -d'
```

**For Production (line ~450):**
```yaml
- name: Deploy to production
  run: |
    # Blue-Green Deployment Example
    ./scripts/deploy-blue-green.sh ${{ steps.version.outputs.version }}
    
    # Or Kubernetes with Helm
    helm upgrade turnone ./helm/turnone --set image.tag=${{ steps.version.outputs.version }}
```

### Health Check URLs

Customize for your infrastructure:
```yaml
# Staging health check
curl -f https://staging.turnone.app/health
curl -f https://staging.turnone.app/health/ready

# Production health check
curl -f https://turnone.app/health
curl -f https://turnone.app/health/ready
```

## 🚀 Setup Instructions

### 1. Enable GitHub Container Registry

```bash
# Generate a Personal Access Token (PAT) with packages:write scope
# Add as repository secret: GITHUB_TOKEN (automatic) or CR_PAT (custom)
```

### 2. Configure Environments

In GitHub Repository Settings → Environments:

**Create `staging` environment:**
- No protection rules
- URL: https://staging.turnone.app

**Create `production` environment:**
- ✅ Required reviewers (1-2 team members)
- ✅ Wait timer: 5 minutes (optional)
- URL: https://turnone.app

### 3. Add Repository Secrets

Go to Settings → Secrets and variables → Actions:

```
# Required
GITHUB_TOKEN - Auto-provided by GitHub

# Optional (for deployments)
DEPLOY_SSH_KEY - SSH key for deployment servers
KUBECONFIG - Kubernetes configuration
AWS_ACCESS_KEY_ID - AWS credentials
AWS_SECRET_ACCESS_KEY - AWS credentials
```

### 4. Branch Protection

Protect `master`/`main` branch:
- ✅ Require pull request reviews
- ✅ Require status checks:
  - `🔒 Security Scanning`
  - `📊 Code Quality Analysis`
  - `🏗️ Build Backend (.NET 9)`
  - `🎨 Build Frontend (Next.js 15)`
  - `🧪 Integration Tests`

### 5. Enable Security Features

- ✅ Dependabot alerts
- ✅ Code scanning
- ✅ Secret scanning
- ✅ Dependency graph

## 📈 Monitoring & Metrics

### Pipeline Metrics

View in GitHub Actions:
- Success rate per job
- Average execution time
- Artifact sizes
- Test results

### Deployment Metrics

Track:
- Deployment frequency
- Lead time for changes
- Mean time to recovery
- Change failure rate

### Cost Optimization

```yaml
# Enable for public repos (unlimited minutes)
# For private repos:
- Optimize job parallelization
- Use smart caching
- Clean up old artifacts
- Consider self-hosted runners
```

## 🐛 Troubleshooting

### Common Issues

**1. Docker build fails**
```bash
# Check Dockerfile paths
# Verify build context
# Review build logs
```

**2. Integration tests timeout**
```bash
# Increase timeout values
# Check health check endpoints
# Review container logs
```

**3. Deployment fails**
```bash
# Verify environment secrets
# Check deployment scripts
# Review post-deployment health checks
```

### Debug Mode

Add to workflow for verbose logging:
```yaml
env:
  ACTIONS_STEP_DEBUG: true
  ACTIONS_RUNNER_DEBUG: true
```

## 📚 Related Documentation

- [Commit Conventions](./COMMIT_CONVENTIONS.md) - Commit message standards
- [Versioning](./VERSIONING.md) - Version management
- [GitHub Actions Integration](./GITHUB_ACTIONS_INTEGRATION.md) - Actions setup
- [Deployment Guide](./DEPLOYMENT.md) - Deployment procedures
- [Docker Documentation](../docker/README.md) - Container setup

## 🎯 Best Practices

### ✅ Do's
- Always run security scans
- Use semantic versioning
- Follow conventional commits
- Test before deploying
- Monitor deployments
- Keep dependencies updated

### ❌ Don'ts
- Skip security checks
- Deploy without tests
- Ignore failed health checks
- Hardcode secrets
- Deploy to production directly
- Skip code reviews

## 📞 Support

For pipeline issues:
1. Check GitHub Actions logs
2. Review job artifacts
3. Check environment configuration
4. Verify secrets and variables
5. Contact DevOps team

---

**Pipeline Version:** 1.0.0  
**Last Updated:** December 15, 2024  
**Maintained by:** Turn One DevOps Team
