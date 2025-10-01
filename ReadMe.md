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
- **Security**: Trivy scanning, Dependabot, SonarCloud
- **Quality**: Automated testing, code coverage, linting
- **Deployment**: Blue-green deployments with health checks

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

## 📈 CI/CD Pipeline

Our enterprise-grade pipeline includes:

1. **Security Scan** - Trivy vulnerability scanning
2. **Code Quality** - ESLint and .NET analyzers
3. **Build & Test** - Multi-platform builds with comprehensive backend testing
4. **Integration Tests** - API health checks and integration testing
5. **Container Build** - Multi-arch Docker images
6. **Deployment** - Automated staging and production deployments
7. **Monitoring** - Health checks and rollback capabilities

## 🚀 Deployment

### Staging
Automatically deployed on every merge to `master` branch.

### Production
Deployed after successful staging validation with manual approval.

### Health Checks
- API: `/health`, `/health/ready`, `/health/live`
- Client: `/api/health`

## 📚 Documentation

- [API Documentation](http://localhost:5000/swagger) - Interactive OpenAPI docs
- [Architecture Decision Records](./docs/adr/) - Design decisions
- [Deployment Guide](./docs/deployment.md) - Production deployment
- [Contributing Guide](./CONTRIBUTING.md) - How to contribute

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](./CONTRIBUTING.md) for details on:

- Code of conduct
- Development process
- Pull request guidelines
- Issue reporting

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🏆 Acknowledgments

- Formula 1 for providing exciting data to analyze
- Open source community for amazing tools and libraries
- Contributors who help make this project better

---

**Built with ❤️ for Formula 1 enthusiasts and data lovers**