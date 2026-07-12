# Enterprise Pipeline Quick Reference

## 🚀 Quick Commands

### Run Pipeline Stages Locally

```bash
# Security Scan
trivy fs . --severity CRITICAL,HIGH,MEDIUM

# Frontend Lint & Type Check
cd turn-one-client
npm run lint
npm run type-check

# Backend Build & Test
cd turn-one-backend
dotnet build turn-one-backend.sln --configuration Release
dotnet test turn-one-backend.sln --configuration Release

# Docker Build
docker build -f docker/api/Dockerfile -t turnone-api:test .
docker build -f docker/client/Dockerfile -t turnone-client:test .

# Integration Tests
docker-compose up -d
curl http://localhost:5271/health
curl http://localhost:3000/api/health
docker-compose down

# Performance Tests
k6 run scripts/performance-test.js

# Deploy (staging)
./scripts/deploy.sh staging v1.2.0
```

## 📊 Pipeline Triggers

| Trigger | Workflow | Jobs |
|---------|----------|------|
| Push to `master`/`main` | All stages + Production deploy | All |
| Push to `dev` | All stages + Staging deploy | All |
| Pull Request | All stages except deploy | Build & Test |
| Tag `v*` | All stages + Production deploy | All + Release |
| Manual Dispatch | Configurable | Selected |

## ⏱️ Expected Timings

| Stage | Duration | Can Fail? |
|-------|----------|-----------|
| Security & Quality | 5-8 min | ⚠️ Warning |
| Build & Test | 8-12 min | ❌ Critical |
| Docker Build | 10-15 min | ❌ Critical |
| Integration Tests | 5-8 min | ❌ Critical |
| Performance Tests | 3-5 min | ⚠️ Warning |
| Deploy Staging | 2-5 min | ❌ Critical |
| Deploy Production | 2-5 min | ❌ Critical |
| **Total (with deploy)** | **35-55 min** | |

## 🔐 Required Secrets

### GitHub Repository Secrets

```bash
# Container Registry (auto-provided)
GITHUB_TOKEN

# Deployment (if using SSH)
DEPLOY_SSH_KEY
DEPLOY_USER
DEPLOY_HOST

# Kubernetes (if using k8s)
KUBE_CONFIG
KUBE_CONTEXT

# Cloud Providers
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AZURE_CREDENTIALS

# Notifications (optional)
SLACK_WEBHOOK_URL
DISCORD_WEBHOOK_URL
```

## 🌐 Environments

### Staging
- **Branch**: `dev`
- **URL**: https://staging.turnone.app
- **Approval**: None
- **Auto-deploy**: Yes

### Production
- **Branch**: `master` / `main`
- **URL**: https://turnone.app
- **Approval**: Required (1-2 reviewers)
- **Auto-deploy**: No

## 📦 Artifacts

### Generated Artifacts
```
security-reports/          # 30 days
├── trivy-results.sarif
└── npm-audit.json

backend-test-results/      # 30 days
├── test-results.trx
└── coverage/

backend-app/               # 7 days
└── published files

frontend-app/              # 7 days
├── .next/
└── public/
```

### Docker Images
```
ghcr.io/owner/repo-api:main
ghcr.io/owner/repo-api:dev
ghcr.io/owner/repo-api:sha-abc123
ghcr.io/owner/repo-api:v1.2.0
ghcr.io/owner/repo-api:latest

ghcr.io/owner/repo-client:main
ghcr.io/owner/repo-client:dev
ghcr.io/owner/repo-client:sha-abc123
ghcr.io/owner/repo-client:v1.2.0
ghcr.io/owner/repo-client:latest
```

## 🎯 Success Criteria

### Build Success
- ✅ All security scans pass (or warnings only)
- ✅ Code quality checks pass
- ✅ All unit tests pass
- ✅ Backend builds successfully
- ✅ Frontend builds successfully
- ✅ Docker images build successfully
- ✅ Integration tests pass

### Deployment Success
- ✅ All build checks pass
- ✅ Health checks respond successfully
- ✅ Smoke tests pass
- ✅ No errors in logs
- ✅ Version verification successful

## 🔄 Manual Operations

### Trigger Release Workflow
```
1. Go to GitHub Actions
2. Select "Release Version"
3. Click "Run workflow"
4. Select:
   - bump_type: auto/major/minor/patch
   - pre_release: (optional) beta.1
5. Click "Run workflow"
```

### Manually Deploy
```bash
# Staging
./scripts/deploy.sh staging v1.2.0

# Production (requires approval)
./scripts/deploy.sh production v1.2.0
```

### Rollback Deployment
```bash
# Get previous version
git tag -l "v*" --sort=-version:refname | head -n 2

# Deploy previous version
./scripts/deploy.sh production v1.1.0

# Or in Kubernetes
kubectl rollout undo deployment/turn-one-api
kubectl rollout undo deployment/turn-one-client
```

## 📈 Monitoring Dashboards

### GitHub Actions
- Actions → Workflows → Enterprise CI/CD Pipeline
- View run history, logs, artifacts

### Security
- Security → Code scanning alerts
- View Trivy vulnerability reports

### Deployments
- Environments → Production/Staging
- View deployment history

## 🐛 Common Issues & Solutions

### Issue: Docker build fails
```bash
# Solution 1: Check Dockerfile paths
# Solution 2: Clear GitHub Actions cache
# Solution 3: Check base image availability
```

### Issue: Integration tests timeout
```bash
# Solution 1: Increase timeout in workflow
# Solution 2: Check docker-compose health checks
# Solution 3: Review container logs
```

### Issue: Deployment fails
```bash
# Solution 1: Verify secrets are set
# Solution 2: Check deployment scripts
# Solution 3: Verify target environment access
```

### Issue: Performance tests fail
```bash
# Solution 1: Adjust k6 thresholds
# Solution 2: Scale up test infrastructure
# Solution 3: Review application performance
```

## 🔧 Pipeline Configuration Files

| File | Purpose |
|------|---------|
| `.github/workflows/enterprise-pipeline.yml` | Main CI/CD pipeline |
| `.github/workflows/validate-commits.yml` | Commit message validation |
| `.github/workflows/release-version.yml` | Automated releases |
| `docker-compose.yml` | Local development & testing |
| `docker/api/Dockerfile` | API container build |
| `docker/client/Dockerfile` | Client container build |
| `scripts/deploy.sh` | Deployment script |
| `scripts/performance-test.js` | k6 load tests |
| `scripts/update-version-auto.ps1` | Version automation |

## 📞 Support Contacts

| Issue Type | Contact |
|------------|---------|
| Pipeline Failures | DevOps Team |
| Security Alerts | Security Team |
| Deployment Issues | Release Manager |
| Performance Issues | Engineering Team |

## 🎓 Learning Resources

- [GitHub Actions Docs](https://docs.github.com/actions)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [k6 Documentation](https://k6.io/docs/)
- [Trivy Documentation](https://aquasecurity.github.io/trivy/)

---

**Last Updated**: December 15, 2024  
**Pipeline Version**: 1.0.0  
**Maintained by**: DevOps Team
