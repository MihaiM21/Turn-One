# Commit Message Templates

Save these templates for easy reference when committing.

## Feature Addition

```
[feat]: Add race strategy comparison tool

Implements a new feature that allows users to compare different
pit stop strategies based on historical data and current race
conditions.

Features:
- Interactive strategy comparison chart
- Real-time fuel calculation
- Tire degradation modeling

Closes #456
```

## Bug Fix

```
[fix]: Resolve WebSocket connection timeout

Fixed an issue where WebSocket connections would timeout after
5 minutes of inactivity. The connection now properly implements
keep-alive pings to maintain the connection.

Fixes #789
```

## Performance Improvement

```
[perf]: Optimize telemetry data processing

Reduced processing time by 60% through:
- Batch processing of incoming messages
- Improved data structure for lookups
- Caching frequently accessed data

Performance measurements show reduction from 150ms to 60ms
average processing time.
```

## Breaking Change (Option 1 - Use [major])

```
[major]: Redesign authentication API

BREAKING CHANGE: The authentication endpoints have been completely
redesigned. The following changes are required:

Before:
  POST /api/auth/login
  Body: { username, password }

After:
  POST /api/v2/auth/token
  Body: { email, password, rememberMe }

Migration guide: docs/AUTH_MIGRATION.md
```

## Breaking Change (Option 2 - Use !)

```
feat!: change telemetry data format

The telemetry WebSocket now sends data in a compressed binary
format instead of JSON for better performance.

BREAKING CHANGE: All WebSocket clients must update their parsers
to handle the new binary format. See docs/TELEMETRY_V2.md for
details.
```

## Documentation

```
[docs]: Update deployment guide for Docker

Added detailed instructions for deploying Turn One using Docker
Compose, including:
- Environment variable configuration
- Volume mounting for persistent data
- HTTPS/SSL setup
- Troubleshooting common issues
```

## Refactoring

```
[refactor]: Simplify race data service

Extracted common data fetching logic into reusable hooks:
- useRaceData for race information
- useTelemetry for live telemetry
- useDriverStats for driver statistics

No functional changes, improved code maintainability.
```

## Multiple Types in One Commit

When a commit includes multiple types, use the most significant one:

```
[feat]: Add user preferences with dark mode

Adds a new user preferences system that allows customization
of the application experience. Initial features:
- Dark/light theme toggle
- Dashboard layout preferences
- Notification settings

Also fixes a bug where theme preference wasn't persisted
across sessions.

Closes #234
Fixes #567
```

## Chore (Dependency Update)

```
[chore]: Update dependencies to latest versions

Updated the following packages:
- @microsoft/signalr: 8.0.6 → 9.0.6
- next: 15.0.0 → 15.5.4
- typescript: 5.5.0 → 5.7.2

All tests passing, no breaking changes.
```

## Test Addition

```
[test]: Add integration tests for race data API

Added comprehensive integration tests for:
- GET /api/races endpoint with various filters
- Race detail retrieval
- Error handling for invalid race IDs
- Performance testing for large datasets

Coverage increased from 65% to 82%.
```

## Style/Formatting

```
[style]: Format code with Prettier

Applied consistent code formatting across all TypeScript files
using Prettier with project configuration.

No functional changes.
```

## Build System

```
[build]: Optimize Docker build process

Improved Docker build performance:
- Multi-stage build reduces image size by 40%
- Layer caching for dependencies
- Parallel builds for frontend and backend

Build time reduced from 8 minutes to 3 minutes.
```

## CI/CD

```
[ci]: Add automated security scanning

Added Trivy security scanner to GitHub Actions workflow:
- Scans Docker images for vulnerabilities
- Runs on every PR and merge to main
- Blocks deployment if critical vulnerabilities found

Integrated with GitHub Security alerts.
```

## Git Configuration

You can set up Git commit templates:

```bash
# Create template file
cat > ~/.gitmessage << 'EOF'
[type]: Brief description

# More detailed explanation (optional)
# - What changed and why
# - Any breaking changes
# - Related issue numbers

# Types: feat, fix, perf, docs, style, refactor, test, chore, build, ci, major
# Breaking changes: Use [major] or add "BREAKING CHANGE:" in body
EOF

# Configure Git to use the template
git config --global commit.template ~/.gitmessage
```

## VS Code Snippet

Add to `.vscode/settings.json` for commit message snippets:

```json
{
  "git.inputValidation": "always",
  "git.inputValidationLength": 72,
  "git.inputValidationSubjectLength": 50
}
```

Create `.vscode/commit.code-snippets`:

```json
{
  "Conventional Commit - Feature": {
    "prefix": "cfeat",
    "body": [
      "[feat]: ${1:description}",
      "",
      "${2:detailed explanation}"
    ],
    "description": "Conventional commit for features"
  },
  "Conventional Commit - Fix": {
    "prefix": "cfix",
    "body": [
      "[fix]: ${1:description}",
      "",
      "${2:detailed explanation}",
      "",
      "Fixes #${3:issue}"
    ],
    "description": "Conventional commit for bug fixes"
  }
}
```
