# Turn One - Formula 1 Data Platform 🏎️

[![CI/CD Pipeline](https://github.com/MihaiM21/Turn-One/actions/workflows/pipeline.yml/badge.svg)](https://github.com/MihaiM21/Turn-One/actions/workflows/pipeline.yml)

A modern, enterprise-grade Formula 1 telemetry and data analysis platform built with .NET 9 and Next.js 15.

## 🚀 Features

- **Real-time F1 Data**: Live telemetry and timing data
- **Modern UI**: Built with Next.js 15, React 19, and Tailwind CSS
- **Robust API**: .NET 9 backend with clean architecture
- **Enterprise Security**: Authentication, authorization, and audit trails
- **Data Visualization**: Interactive charts and real-time dashboards
- **Mobile Responsive**: Optimized for all devices

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js 15    │    │    .NET 9 API   │    │    SQLite DB    │
│   Frontend      │◄──►│    Backend      │◄──►│    Storage      │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **UI**: React 19, Tailwind CSS, Radix UI
- **State**: React Query, Zustand
- **Monitoring**: Vercel Analytics

### Backend  
- **Framework**: .NET 9 with ASP.NET Core
- **Architecture**: Clean Architecture (Domain, Application, Infrastructure)
- **Database**: SQLite with Entity Framework Core
- **Authentication**: JWT Bearer tokens
- **Documentation**: OpenAPI/Swagger

### DevOps & CI/CD
- **Pipeline**: GitHub Actions with enterprise security
- **Containerization**: Docker with multi-stage builds
- **Security**: Trivy scanning, Dependabot, SARIF reports
- **Quality**: Automated testing, code coverage, linting
- **Deployment**: Blue-green deployments with health checks
- **Monitoring**: Performance testing with k6
- **Registry**: GitHub Container Registry (ghcr.io)
- **Automation**: Conventional commits → Auto versioning → Release

## 🚦 Getting Started

### Prerequisites
- Node.js 20+
- .NET 9 SDK
- Docker (optional)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/MihaiM21/Turn-One.git
   cd Turn-One
   ```

2. **Start the API**
   ```bash
   cd turn-one-backend
   dotnet restore
   dotnet run --project API
   ```

3. **Start the Client**
   ```bash
   cd turn-one-client
   npm install
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - API: http://localhost:5000
   - Swagger: http://localhost:5000/swagger

### Docker Development

```bash
# Build and run with Docker Compose
docker-compose up --build

# Access applications
# Frontend: http://localhost:3000
# API: http://localhost:5000
```

## 🧪 Testing

### Backend Tests
```bash
cd turn-one-backend

# Run all tests
dotnet test

# With coverage
dotnet test --collect:"XPlat Code Coverage"
```

## 📊 Code Quality

This project maintains code quality through:

- **ESLint/Prettier**: Frontend code formatting and linting
- **EditorConfig**: Consistent coding styles
- **TypeScript**: Type safety throughout the frontend
- **C# Analyzers**: Static code analysis for backend

## 🔒 Security

Security is a top priority:

- **Vulnerability Scanning**: Automated with Trivy
- **Dependency Updates**: Automated with Dependabot
- **Container Security**: Non-root containers, minimal attack surface
- **Authentication**: JWT-based secure authentication
- **HTTPS**: TLS encryption in production

## 📈 Enterprise CI/CD Pipeline

[![Enterprise Pipeline](https://github.com/USERNAME/REPO/actions/workflows/enterprise-pipeline.yml/badge.svg)](https://github.com/USERNAME/REPO/actions/workflows/enterprise-pipeline.yml)

Our production-ready pipeline includes:

### 🔒 **Stage 1: Security & Quality** (Parallel)
- **Trivy Scanning** - Filesystem and container vulnerability detection
- **SARIF Reports** - Integrated with GitHub Security
- **npm Audit** - Frontend dependency security
- **ESLint & TypeScript** - Code quality and type safety
- **.NET Analyzers** - Backend code analysis

### 🏗️ **Stage 2: Build & Test** (Parallel)
- **Backend Build** - .NET 9 with unit tests and code coverage
- **Frontend Build** - Next.js 15 production build
- **Test Reports** - TRX format with artifact upload
- **Build Artifacts** - Optimized for deployment

### 🐳 **Stage 3: Docker Build** (Matrix Strategy)
- **Multi-stage Builds** - Optimized image sizes
- **Security Scanning** - Trivy container scans
- **Registry Push** - GitHub Container Registry
- **Smart Tagging** - Version, branch, SHA, and latest tags
- **Layer Caching** - Fast builds with GHA cache

### 🧪 **Stage 4: Integration Tests**
- **Docker Compose** - Full-stack integration
- **Health Checks** - API and Client validation
- **Smoke Tests** - Critical endpoint verification
- **Auto Cleanup** - Resource management

### ⚡ **Stage 5: Performance Tests** (Main branch)
- **k6 Load Testing** - Scalability validation
- **Thresholds** - Performance SLA enforcement
- **Metrics Collection** - Response times and error rates

### 🚀 **Stage 6: Deployment**
- **Staging** - Automatic deployment on dev branch
- **Production** - Manual approval on master/main
- **Health Checks** - Post-deployment validation
- **Deployment Records** - GitHub environment tracking

**Full Documentation:** [Pipeline Documentation](./docs/PIPELINE_DOCUMENTATION.md)

## 🚀 Deployment

### Staging
Automatically deployed on every merge to `master` branch.

### Production
Deployed after successful staging validation with manual approval.

### Health Checks
- API: `/health`, `/health/ready`, `/health/live`
- Client: `/api/health`

## 📚 Documentation

- **Pipeline Documentation** - [docs/PIPELINE_DOCUMENTATION.md](./docs/PIPELINE_DOCUMENTATION.md)
- **Deployment Scenarios** - [docs/DEPLOYMENT_SCENARIOS.md](./docs/DEPLOYMENT_SCENARIOS.md)
- **API Documentation** - [Swagger UI](http://localhost:5000/swagger)
- **Commit Conventions** - [docs/COMMIT_CONVENTIONS.md](./docs/COMMIT_CONVENTIONS.md)
- **Versioning Guide** - [docs/VERSIONING.md](./docs/VERSIONING.md)
- **GitHub Actions Integration** - [docs/GITHUB_ACTIONS_INTEGRATION.md](./docs/GITHUB_ACTIONS_INTEGRATION.md)
- **Architecture Decisions** - [docs/adr/](./docs/adr/)
- **Contributing Guide** - [CONTRIBUTING.md](./CONTRIBUTING.md)

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](./CONTRIBUTING.md) for details on:

- Code of conduct
- Development process
- Pull request guidelines
- Issue reporting

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 📋 Versioning & Commits

This project uses [Semantic Versioning](https://semver.org/) with **conventional commits** for automated version management.

### Quick Start

```powershell
# Commit with conventional format
git commit -m "[feat]: Add new feature"
git commit -m "[fix]: Bug fix description"

# Automatically update version based on commits
.\scripts\update-version-auto.ps1

# Preview changes without modifying files
.\scripts\update-version-auto.ps1 -DryRun
```

### Commit Types

- `[feat]:` → Minor version bump (new features)
- `[fix]:` → Patch version bump (bug fixes)
- `[major]:` or `BREAKING CHANGE:` → Major version bump
- `[docs]`, `[chore]`, `[style]`, etc. → No version bump

### Documentation

- **Quick Reference**: [docs/QUICK_REFERENCE_VERSIONING.md](./docs/QUICK_REFERENCE_VERSIONING.md)
- **Full Convention Guide**: [docs/COMMIT_CONVENTIONS.md](./docs/COMMIT_CONVENTIONS.md)
- **Versioning Details**: [docs/VERSIONING.md](./docs/VERSIONING.md)
- **Changelog**: [CHANGELOG.md](./CHANGELOG.md)

## 🏆 Acknowledgments

- Formula 1 for providing exciting data to analyze
- Open source community for amazing tools and libraries
- Contributors who help make this project better

---

**Built with ❤️ for Formula 1 enthusiasts and data lovers**