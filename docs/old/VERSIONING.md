# Turn One Versioning

This project uses Semantic Versioning (SemVer) to manage versions. The version format is:

```
MAJOR.MINOR.PATCH[-PRERELEASE][+BUILDMETADATA]
```

Where:
- **MAJOR** version changes indicate incompatible API changes
- **MINOR** version changes add functionality in a backwards-compatible manner
- **PATCH** version changes include backwards-compatible bug fixes
- **PRERELEASE** and **BUILDMETADATA** provide additional information about the build

## Version Management

The current version is stored in multiple locations:
- `turn-one-backend/VERSION` - Source of truth for backend version
- `turn-one-client/package.json` - Frontend package version
- `CHANGELOG.md` - Historical record of all changes

## Conventional Commits & Automated Versioning

Turn One uses **conventional commits** to automate version bumping and changelog generation. By following commit message conventions, the version update tool automatically determines the appropriate version bump.

### Quick Start

```powershell
# Automatic version bump based on commit history
.\scripts\update-version-auto.ps1

# Preview what would change (dry run)
.\scripts\update-version-auto.ps1 -DryRun

# Analyze specific commit range
.\scripts\update-version-auto.ps1 -FromCommit HEAD~10

# Add pre-release label
.\scripts\update-version-auto.ps1 -PreRelease "beta.1"
```

### Commit Message Format

Use these prefixes in your commit messages:

- `[feat]:` or `feat:` - New feature → **MINOR** bump (1.0.0 → 1.1.0)
- `[fix]:` or `fix:` - Bug fix → **PATCH** bump (1.0.0 → 1.0.1)
- `[perf]:` or `perf:` - Performance improvement → **PATCH** bump
- `[major]:` or `BREAKING CHANGE:` - Breaking change → **MAJOR** bump (1.0.0 → 2.0.0)

Other types (`docs`, `chore`, `style`, `refactor`, `test`, `build`, `ci`) are tracked but don't trigger version bumps.

**See [COMMIT_CONVENTIONS.md](./COMMIT_CONVENTIONS.md) for detailed guidelines.**

### Manual Version Updates

For manual control, use the traditional script:

```powershell
# Increment patch version
.\scripts\update-version.ps1 patch

# Increment minor version
.\scripts\update-version.ps1 minor

# Increment major version
.\scripts\update-version.ps1 major

# With pre-release and build metadata
.\scripts\update-version.ps1 patch beta.1 build.123 "Fixed dashboard bugs"
```

## Version Display

The current version is displayed in the footer of the application and can be queried through the version API. 

## Changelog

All version changes are automatically documented in `CHANGELOG.md`. The automated version tool generates changelog entries with:

- 💥 **Breaking Changes** - Major version increments
- ✨ **Features** - New functionality
- 🐛 **Bug Fixes** - Issue resolutions
- 🔧 **Other Changes** - Documentation, refactoring, etc.

Each entry includes commit hashes for traceability.

## Workflow Example

1. **Make changes and commit with conventional format:**
   ```bash
   git commit -m "[feat]: Add live race commentary feature"
   git commit -m "[fix]: Resolve timing data sync issue"
   ```

2. **Run automated version update:**
   ```powershell
   .\scripts\update-version-auto.ps1
   ```
   
   This will:
   - Analyze commits since last version tag
   - Determine version bump (MINOR in this case due to `[feat]`)
   - Update VERSION file and package.json
   - Generate CHANGELOG.md entry
   - Display git commands to complete the release

3. **Commit and tag the version:**
   ```bash
   git add turn-one-backend/VERSION turn-one-client/package.json CHANGELOG.md
   git commit -m "chore: bump version to 1.1.0"
   git tag v1.1.0
   git push && git push --tags
   ``` 

## Version API

The application provides API endpoints for version management:

- `GET /api/version/current`: Get the current version
- `GET /api/version/history`: Get the version history
- `POST /api/version/update`: Update the version (requires admin privileges)

## Git Workflow & Best Practices

### Recommended Workflow

1. **Feature branches:** Create branches for new features or fixes
   ```bash
   git checkout -b feature/live-commentary
   ```

2. **Conventional commits:** Use proper commit message format
   ```bash
   git commit -m "[feat]: Add live race commentary"
   ```

3. **Merge to main:** Merge feature branch when ready
   ```bash
   git checkout main
   git merge feature/live-commentary
   ```

4. **Automated versioning:** Run version update tool
   ```powershell
   .\scripts\update-version-auto.ps1
   ```

5. **Tag and push:** Complete the release
   ```bash
   git push && git push --tags
   ```

### Git Tags

Always tag versions in git:

```bash
git tag v1.2.3
git push --tags
```

Tags should match the version in VERSION file (with `v` prefix).

## Semantic Versioning Guidelines

### When to increment MAJOR version

- Incompatible API changes
- Breaking changes to the data model
- Major UI overhaul
- Changes that require users to update their usage

### When to increment MINOR version

- New features added in a backwards-compatible manner
- Significant improvements to existing features
- Deprecation of functionality (but not removal)

### When to increment PATCH version

- Bug fixes
- Performance improvements
- Minor tweaks and refinements
- Documentation changes

### Pre-release labels

Common pre-release labels include:
- `alpha`: Early testing, expect bugs
- `beta`: Feature complete but still testing
- `rc`: Release candidate, potentially final version

## Examples

- `1.0.0`: Initial release
- `1.0.1`: Bug fixes
- `1.1.0`: New features added
- `2.0.0`: Breaking changes
- `1.0.0-alpha.1`: Alpha release
- `1.0.0-beta.2`: Second beta release
- `1.0.0-rc.1`: Release candidate
- `1.0.0+build.123`: Build metadata