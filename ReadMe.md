# Turn One 🏎️

[![CI/CD Pipeline](https://github.com/MihaiM21/Turn-One/actions/workflows/pipeline.yml/badge.svg)](https://github.com/MihaiM21/Turn-One/actions/workflows/pipeline.yml)

Turn One is a Formula 1 telemetry and sim-racing platform: live F1 timing, sim-racing telemetry analysis and coaching tools, and a gamification layer (predictions, rewards, and a game hub) — built with .NET 9 and Next.js 15.

> **Unofficial project.** Turn One is a fan-built platform and is not affiliated with, endorsed by, or sponsored by Formula 1, the FIA, or Liberty Media. F1, FORMULA 1, and related marks are trademarks of Formula One Licensing B.V. F1 data shown is sourced from public/community feeds, not an official Formula 1 data license.

## 🚀 Features

- **Live F1 Timing** — real-time race timing and telemetry viewer
- **Sim-Racing Telemetry & Coaching** — multi-channel telemetry charts, replay scrubber, live leaderboards, streamer overlays
- **Telemetry Chart Generator** — generate shareable telemetry visualizations
- **Predictions & Rewards** — predict race outcomes, earn coins/tokens/XP, track progress on a leaderboard
- **Game Hub** — gamified in-app store and mini-games
- **Modern UI** — Next.js 15, React 19, Tailwind CSS
- **Robust API** — .NET 9 backend with clean architecture, JWT auth, SignalR hubs

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js 15    │    │    .NET 9 API   │    │   SQLite/Postgres│
│   Frontend      │◄──►│    Backend      │◄──►│    Storage      │
│                 │    │  (SignalR hubs) │    │                 │
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
- **Architecture**: Clean Architecture (Domain, Application, Infrastructure, API)
- **Database**: SQLite (dev) / PostgreSQL (production) with Entity Framework Core
- **Real-time**: SignalR hubs for live telemetry
- **Authentication**: JWT Bearer tokens
- **Documentation**: OpenAPI/Swagger

### CI/CD
- GitHub Actions: lint (ESLint, TypeScript, `dotnet format`), build, and test (with coverage) for both frontend and backend on every push/PR
- Conventional commits drive automated versioning (see below)

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
   - API: http://localhost:5271
   - Swagger: http://localhost:5271/swagger

### Docker Development

```bash
docker-compose up --build
```

## 🧪 Testing

```bash
cd turn-one-backend

# Run all tests
dotnet test

# With coverage
dotnet test --collect:"XPlat Code Coverage"
```

Frontend:
```bash
cd turn-one-client
npm run lint
npm run type-check
```

## 📋 Versioning & Commits

This project follows [Conventional Commits](./docs/old/COMMIT_CONVENTIONS.md) and [Semantic Versioning](https://semver.org/); version bumps are automated by CI based on commit prefixes (`feat`, `fix`, `chore`, `patch`, `refactor`, `docs`, `test`).

## 📝 License

This project is **proprietary and source-available, not open source** — see the [LICENSE](./LICENSE) file. No permission is granted to use, copy, modify, or distribute this code.

---

**Built for Formula 1 enthusiasts and sim racers**
