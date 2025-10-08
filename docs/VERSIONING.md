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

The current version of the application is stored in the `VERSION` file at the root of the project. This file should be committed to Git along with code changes.

The version is also stored in the database and can be queried through the API.

## Updating the Version

You can update the version using the provided scripts:

### For Linux/macOS users:

```bash
# Increment patch version
./scripts/update-version.sh patch

# Increment minor version
./scripts/update-version.sh minor

# Increment major version
./scripts/update-version.sh major

# With pre-release and build metadata
./scripts/update-version.sh patch beta.1 build.123 "Fixed dashboard bugs"
```

### For Windows users:

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

The current version is displayed in the footer of the application. 

## Version API

The application provides API endpoints for version management:

- `GET /api/version/current`: Get the current version
- `GET /api/version/history`: Get the version history
- `POST /api/version/update`: Update the version (requires admin privileges)

## Git Workflow

When updating the version, it's recommended to tag the Git repository with the new version:

```bash
git add VERSION
git commit -m "Bump version to X.Y.Z"
git tag vX.Y.Z
git push && git push --tags
```

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