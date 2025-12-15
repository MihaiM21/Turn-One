# Commit Message Convention

This document outlines the commit message conventions used in the Turn One project. Following these conventions enables automated version bumping and changelog generation.

## Format

Commit messages should follow this format:

```
[type]: description

[optional body]

[optional footer]
```

Or using parentheses for conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

Both formats are supported by our automation tools.

## Types

### Feature and Enhancement Types

#### `[feat]` or `feat:` - New Feature
Introduces a new feature to the codebase. This will trigger a **MINOR** version bump.

**Examples:**
```
[feat]: Add live race telemetry dashboard
feat(telemetry): implement real-time tire temperature monitoring
[feat]: User profile customization options
```

#### `[fix]` or `fix:` - Bug Fix
Fixes a bug in the codebase. This will trigger a **PATCH** version bump.

**Examples:**
```
[fix]: Resolve crash when loading historical race data
fix(auth): prevent token expiration edge case
[fix]: Correct lap time calculation in qualifying
```

#### `[perf]` or `perf:` - Performance Improvement
Improves performance without changing functionality. This will trigger a **PATCH** version bump.

**Examples:**
```
[perf]: Optimize WebSocket message processing
perf(database): add index to lap_times table
[perf]: Reduce memory usage in telemetry buffering
```

### Breaking Changes and Major Updates

#### `[major]` or `BREAKING CHANGE` - Major Version Bump
Indicates incompatible API changes or breaking modifications. This will trigger a **MAJOR** version bump.

**Examples:**
```
[major]: Redesign authentication flow with OAuth2
feat!: change telemetry data format (breaking change)
[fix]: correct user permissions model

BREAKING CHANGE: All existing user roles have been restructured
```

**Ways to indicate breaking changes:**
1. Use `[major]` prefix
2. Add `!` after type: `feat!:` or `fix!:`
3. Include `BREAKING CHANGE:` in the commit body or footer
4. Use `breaking:` in the message

### Non-Version-Bumping Types

These types do not trigger version bumps but are included in changelogs:

#### `[docs]` or `docs:` - Documentation
Documentation only changes.

**Examples:**
```
[docs]: Update API endpoint documentation
docs(readme): add setup instructions for Windows
```

#### `[style]` or `style:` - Code Style
Changes that don't affect code meaning (formatting, whitespace, etc.).

**Examples:**
```
[style]: Format code with Prettier
style: fix indentation in TelemetryService
```

#### `[refactor]` or `refactor:` - Code Refactoring
Code changes that neither fix bugs nor add features.

**Examples:**
```
[refactor]: Simplify race data processing logic
refactor(hooks): extract common data fetching logic
```

#### `[test]` or `test:` - Tests
Adding or updating tests.

**Examples:**
```
[test]: Add unit tests for lap time calculation
test(e2e): add race viewer integration tests
```

#### `[chore]` or `chore:` - Maintenance
Routine tasks, dependency updates, build changes.

**Examples:**
```
[chore]: Update npm dependencies
chore: bump version to 1.2.3
chore(deps): upgrade @microsoft/signalr to 9.0.6
```

#### `[build]` or `build:` - Build System
Changes to build system or external dependencies.

**Examples:**
```
[build]: Update Docker base image
build(webpack): optimize bundle size
```

#### `[ci]` or `ci:` - CI/CD
Changes to CI configuration files and scripts.

**Examples:**
```
[ci]: Add automated deployment workflow
ci(github): update Node version in actions
```

## Scope (Optional)

The scope is optional and provides additional context about what part of the codebase is affected:

```
feat(telemetry): add tire wear prediction
fix(auth): resolve session timeout issue
docs(api): update endpoint documentation
```

Common scopes in Turn One:
- `api` - Backend API changes
- `client` - Frontend client changes
- `auth` - Authentication/authorization
- `telemetry` - Telemetry data handling
- `database` - Database schema or queries
- `signalr` - SignalR hub changes
- `docker` - Docker configuration
- `ci` - CI/CD pipelines

## Body

The body is optional and should provide additional context about the change:

```
[feat]: Add race strategy analyzer

This feature allows users to analyze different pit stop strategies
based on historical data and current race conditions. It includes:
- Strategy comparison tool
- Fuel consumption calculator
- Tire degradation model
```

## Footer

The footer is optional and can contain:
- Breaking change descriptions
- Issue references
- Co-authors

**Examples:**
```
[feat]: Update telemetry data format

BREAKING CHANGE: The telemetry WebSocket now sends data in a new
compressed format. Clients must update their parsers to handle the
new structure.

Closes #123
```

```
[fix]: Resolve race condition in data sync

Fixes #456
Co-authored-by: Jane Doe <jane@example.com>
```

## Version Bump Rules

The automated version update tool analyzes commit messages and determines the version bump:

| Commit Type | Version Bump | Example |
|-------------|--------------|---------|
| `BREAKING CHANGE` or `[major]` | **MAJOR** (1.0.0 → 2.0.0) | API redesign |
| `[feat]` | **MINOR** (1.0.0 → 1.1.0) | New feature |
| `[fix]` or `[perf]` | **PATCH** (1.0.0 → 1.0.1) | Bug fix |
| Other types | **No bump** | Documentation, tests, etc. |

**Priority:** If multiple types exist in commit history, the highest priority applies:
1. Breaking changes (MAJOR)
2. Features (MINOR)
3. Fixes (PATCH)

## Examples

### Good Commit Messages

```
[feat]: Add driver performance comparison chart

Implements a new interactive chart that allows users to compare
driver performance metrics across different race sessions.
```

```
fix(auth): prevent duplicate login attempts

Added debouncing to login button and improved error handling
for concurrent authentication requests.

Fixes #789
```

```
[major]: Redesign telemetry WebSocket protocol

BREAKING CHANGE: The WebSocket message format has been completely
redesigned for better performance and extensibility. All clients
must update their integration code.

- New binary message format
- Reduced bandwidth by 40%
- Support for custom telemetry channels

Migration guide available at docs/TELEMETRY_MIGRATION.md
```

```
[perf]: Optimize database queries for race history

Reduced query time by 60% by adding composite indexes and
optimizing JOIN operations.
```

### Bad Commit Messages

```
❌ update stuff
❌ fix bug
❌ WIP
❌ minor changes
❌ asdf
❌ Update API.cs
```

These messages don't follow the convention and won't be properly categorized by the automation tools.

## Using the Automated Version Tool

Once you've followed these conventions in your commits, you can automatically bump the version:

```powershell
# Analyze commits since last tag and bump version
.\scripts\update-version-auto.ps1

# Analyze specific commit range
.\scripts\update-version-auto.ps1 -FromCommit HEAD~10 -ToCommit HEAD

# Preview changes without making them
.\scripts\update-version-auto.ps1 -DryRun

# Force a version bump even without conventional commits
.\scripts\update-version-auto.ps1 -Force

# Add pre-release label
.\scripts\update-version-auto.ps1 -PreRelease "beta.1"
```

The tool will:
1. Analyze commit messages
2. Determine the appropriate version bump
3. Update VERSION file and package.json
4. Generate/update CHANGELOG.md
5. Provide git commands for committing and tagging

## Tips

1. **Be descriptive:** Make commit messages clear and meaningful
2. **Use present tense:** "Add feature" not "Added feature"
3. **Capitalize appropriately:** First letter after type should be lowercase
4. **Reference issues:** Use "Fixes #123" or "Closes #123" in footers
5. **One logical change per commit:** Don't mix multiple unrelated changes
6. **Breaking changes:** Always document what breaks and how to migrate

## Integration with CI/CD

These conventions can be enforced in CI/CD:

- **commitlint:** Validate commit messages format
- **semantic-release:** Automate versioning and releases
- **changelog generator:** Auto-generate release notes

Consider adding a pre-commit hook to validate message format locally.
