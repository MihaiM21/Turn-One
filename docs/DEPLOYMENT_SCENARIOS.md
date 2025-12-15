# Pipeline Configuration Guide

## 🎯 Deployment Scenarios

Turn One supports multiple deployment configurations. Choose the one that fits your infrastructure.

## 📦 Scenario 1: Docker Compose (Simplest)

### Best for:
- Small teams
- Single-server deployments
- Development/staging environments

### Setup:

1. **Configure docker-compose.yml:**
```yaml
version: '3.8'

services:
  api:
    image: ghcr.io/yourorg/turn-one-api:${VERSION:-latest}
    ports:
      - "5271:5271"
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - DATABASE_URL=${DATABASE_URL}
    restart: unless-stopped

  client:
    image: ghcr.io/yourorg/turn-one-client:${VERSION:-latest}
    ports:
      - "3000:3000"
    environment:
      - API_URL=http://api:5271
    depends_on:
      - api
    restart: unless-stopped
```

2. **Deploy:**
```bash
# Pull images
docker-compose pull

# Start services
docker-compose up -d

# Check health
curl http://localhost:5271/health
curl http://localhost:3000/api/health
```

3. **Update GitHub Actions workflow:**
```yaml
- name: Deploy with Docker Compose
  run: |
    ssh ${{ secrets.DEPLOY_USER }}@${{ secrets.DEPLOY_HOST }} << 'EOF'
      cd /opt/turnone
      export VERSION=${{ github.sha }}
      docker-compose pull
      docker-compose up -d
    EOF
```

---

## ☸️ Scenario 2: Kubernetes (Scalable)

### Best for:
- Large-scale deployments
- High availability requirements
- Multi-region deployments

### Setup:

1. **Create Kubernetes manifests:**

**k8s/deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: turn-one-api
  namespace: turnone
spec:
  replicas: 3
  selector:
    matchLabels:
      app: turn-one-api
  template:
    metadata:
      labels:
        app: turn-one-api
    spec:
      containers:
      - name: api
        image: ghcr.io/yourorg/turn-one-api:VERSION_TAG
        ports:
        - containerPort: 5271
        env:
        - name: ASPNETCORE_ENVIRONMENT
          value: "Production"
        livenessProbe:
          httpGet:
            path: /health/live
            port: 5271
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 5271
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: turn-one-client
  namespace: turnone
spec:
  replicas: 3
  selector:
    matchLabels:
      app: turn-one-client
  template:
    metadata:
      labels:
        app: turn-one-client
    spec:
      containers:
      - name: client
        image: ghcr.io/yourorg/turn-one-client:VERSION_TAG
        ports:
        - containerPort: 3000
        env:
        - name: API_URL
          value: "http://turn-one-api:5271"
---
apiVersion: v1
kind: Service
metadata:
  name: turn-one-api
  namespace: turnone
spec:
  selector:
    app: turn-one-api
  ports:
  - port: 5271
    targetPort: 5271
  type: ClusterIP
---
apiVersion: v1
kind: Service
metadata:
  name: turn-one-client
  namespace: turnone
spec:
  selector:
    app: turn-one-client
  ports:
  - port: 3000
    targetPort: 3000
  type: LoadBalancer
```

2. **Update GitHub Actions workflow:**
```yaml
- name: Deploy to Kubernetes
  run: |
    kubectl config use-context ${{ secrets.KUBE_CONTEXT }}
    kubectl set image deployment/turn-one-api \
      api=ghcr.io/yourorg/turn-one-api:${{ github.sha }} \
      -n turnone
    kubectl set image deployment/turn-one-client \
      client=ghcr.io/yourorg/turn-one-client:${{ github.sha }} \
      -n turnone
    kubectl rollout status deployment/turn-one-api -n turnone
    kubectl rollout status deployment/turn-one-client -n turnone
```

---

## 🔵 Scenario 3: Azure App Service

### Best for:
- Azure-native deployments
- Managed platform benefits
- Quick setup

### Setup:

1. **Create App Services:**
```bash
# Create resource group
az group create --name turnone-rg --location eastus

# Create App Service Plan
az appservice plan create \
  --name turnone-plan \
  --resource-group turnone-rg \
  --is-linux \
  --sku P1V2

# Create API App Service
az webapp create \
  --resource-group turnone-rg \
  --plan turnone-plan \
  --name turnone-api \
  --deployment-container-image-name ghcr.io/yourorg/turn-one-api:latest

# Create Client App Service
az webapp create \
  --resource-group turnone-rg \
  --plan turnone-plan \
  --name turnone-client \
  --deployment-container-image-name ghcr.io/yourorg/turn-one-client:latest
```

2. **Update GitHub Actions workflow:**
```yaml
- name: Deploy to Azure App Service
  uses: azure/webapps-deploy@v2
  with:
    app-name: 'turnone-api'
    images: 'ghcr.io/yourorg/turn-one-api:${{ github.sha }}'
    
- name: Deploy Client to Azure
  uses: azure/webapps-deploy@v2
  with:
    app-name: 'turnone-client'
    images: 'ghcr.io/yourorg/turn-one-client:${{ github.sha }}'
```

---

## 🟠 Scenario 4: AWS ECS/Fargate

### Best for:
- AWS-native deployments
- Serverless containers
- Cost optimization

### Setup:

1. **Create ECS Task Definition:**
```json
{
  "family": "turn-one",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "ghcr.io/yourorg/turn-one-api:VERSION",
      "portMappings": [
        {
          "containerPort": 5271,
          "protocol": "tcp"
        }
      ],
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:5271/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      }
    },
    {
      "name": "client",
      "image": "ghcr.io/yourorg/turn-one-client:VERSION",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ]
    }
  ]
}
```

2. **Update GitHub Actions workflow:**
```yaml
- name: Deploy to AWS ECS
  uses: aws-actions/amazon-ecs-deploy-task-definition@v1
  with:
    task-definition: ecs-task-definition.json
    service: turn-one-service
    cluster: turn-one-cluster
    wait-for-service-stability: true
```

---

## 🌐 Scenario 5: Vercel (Frontend) + Custom Backend

### Best for:
- Optimized Next.js deployments
- Edge network benefits
- Separate frontend/backend scaling

### Setup:

1. **Deploy Client to Vercel:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from turn-one-client directory
cd turn-one-client
vercel --prod
```

2. **Deploy API separately (any method above)**

3. **Configure environment variables in Vercel:**
```
NEXT_PUBLIC_API_URL=https://api.turnone.app
```

4. **Update GitHub Actions workflow:**
```yaml
- name: Deploy Client to Vercel
  uses: amondnet/vercel-action@v25
  with:
    vercel-token: ${{ secrets.VERCEL_TOKEN }}
    vercel-org-id: ${{ secrets.ORG_ID }}
    vercel-project-id: ${{ secrets.PROJECT_ID }}
    working-directory: ./turn-one-client
```

---

## 🔧 Common Configuration

### Environment Variables

**API (.NET):**
```bash
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://+:5271
DATABASE_URL=postgresql://user:pass@host:5432/turnone
JWT_SECRET=your-secret-key
CORS_ORIGINS=https://turnone.app
```

**Client (Next.js):**
```bash
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
NEXT_PUBLIC_API_URL=https://api.turnone.app
API_URL=http://api:5271  # Internal network
```

### Health Check Endpoints

Add these to your infrastructure:

**API Health Checks:**
- `/health` - Basic health check
- `/health/ready` - Readiness probe
- `/health/live` - Liveness probe

**Client Health Check:**
- `/api/health` - Next.js API route health check

### SSL/TLS Configuration

**Option 1: Reverse Proxy (nginx):**
```nginx
server {
    listen 443 ssl http2;
    server_name turnone.app;
    
    ssl_certificate /etc/letsencrypt/live/turnone.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/turnone.app/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 443 ssl http2;
    server_name api.turnone.app;
    
    ssl_certificate /etc/letsencrypt/live/api.turnone.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.turnone.app/privkey.pem;
    
    location / {
        proxy_pass http://localhost:5271;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Option 2: Kubernetes Ingress:**
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: turn-one-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - turnone.app
    - api.turnone.app
    secretName: turnone-tls
  rules:
  - host: turnone.app
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: turn-one-client
            port:
              number: 3000
  - host: api.turnone.app
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: turn-one-api
            port:
              number: 5271
```

---

## 🔄 Blue-Green Deployment

For zero-downtime deployments:

```bash
#!/bin/bash
# deploy-blue-green.sh

ENVIRONMENT=$1
VERSION=$2

echo "Starting blue-green deployment..."

# Deploy to "green" environment
kubectl apply -f k8s/deployment-green.yaml

# Wait for green to be ready
kubectl wait --for=condition=ready pod -l env=green --timeout=300s

# Run smoke tests on green
./scripts/smoke-tests.sh green

# If tests pass, switch traffic
kubectl patch service turn-one-service -p '{"spec":{"selector":{"env":"green"}}}'

# Remove blue deployment after grace period
sleep 60
kubectl delete -f k8s/deployment-blue.yaml

echo "Blue-green deployment completed!"
```

---

## 📊 Monitoring Integration

### Prometheus Metrics

Add to your application:

**API (Program.cs):**
```csharp
app.UseMetricServer();  // Expose /metrics endpoint
```

**Prometheus scrape config:**
```yaml
scrape_configs:
  - job_name: 'turn-one-api'
    static_configs:
      - targets: ['api.turnone.app:5271']
    metrics_path: '/metrics'
```

### Grafana Dashboards

Import dashboards for:
- Application performance
- Request rates
- Error rates
- Response times

---

## 🚨 Alerting

### Example Alert Rules

```yaml
groups:
- name: turn-one-alerts
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
    for: 5m
    annotations:
      summary: "High error rate detected"
      
  - alert: SlowResponse
    expr: histogram_quantile(0.95, http_request_duration_seconds_bucket) > 1
    for: 5m
    annotations:
      summary: "95th percentile response time > 1s"
```

---

## 📝 Deployment Checklist

Before deploying to production:

- [ ] All tests passing
- [ ] Security scans clean
- [ ] Database migrations ready
- [ ] Environment variables configured
- [ ] SSL certificates valid
- [ ] Health checks working
- [ ] Monitoring configured
- [ ] Alerts configured
- [ ] Backup strategy in place
- [ ] Rollback plan documented
- [ ] Team notified

---

## 🆘 Troubleshooting

### Common Issues

**1. Image pull failures:**
```bash
# Check registry authentication
kubectl create secret docker-registry regcred \
  --docker-server=ghcr.io \
  --docker-username=$USERNAME \
  --docker-password=$TOKEN
```

**2. Health check failures:**
```bash
# Check container logs
kubectl logs -f deployment/turn-one-api
docker-compose logs -f api
```

**3. Database connection issues:**
```bash
# Verify connection string
# Check network connectivity
# Verify migrations applied
```

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Azure App Service](https://docs.microsoft.com/azure/app-service/)
- [AWS ECS](https://docs.aws.amazon.com/ecs/)
- [Vercel Documentation](https://vercel.com/docs)
