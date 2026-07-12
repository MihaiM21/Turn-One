# Quick Reference: Versioning & Commits

## Commit Message Cheat Sheet

| Type | Format | Version Bump | Example |
|------|--------|--------------|---------|
| 🚀 Feature | `[feat]: description` | MINOR | `[feat]: Add live timing dashboard` |
| 🐛 Bug Fix | `[fix]: description` | PATCH | `[fix]: Resolve data sync issue` |
| ⚡ Performance | `[perf]: description` | PATCH | `[perf]: Optimize WebSocket handling` |
| 💥 Breaking | `[major]: description` | MAJOR | `[major]: Redesign API structure` |
| 📝 Docs | `[docs]: description` | None | `[docs]: Update API documentation` |
| 🎨 Style | `[style]: description` | None | `[style]: Format with Prettier` |
| ♻️ Refactor | `[refactor]: description` | None | `[refactor]: Simplify data service` |
| ✅ Tests | `[test]: description` | None | `[test]: Add telemetry unit tests` |
| 🔧 Chore | `[chore]: description` | None | `[chore]: Update dependencies` |

## Version Update Commands

### Automatic (Recommended)

```powershell
# Analyze commits and auto-bump version
.\scripts\update-version-auto.ps1

# Preview changes (no modifications)
.\scripts\update-version-auto.ps1 -DryRun

# Specific commit range
.\scripts\update-version-auto.ps1 -FromCommit HEAD~10

# With pre-release label
.\scripts\update-version-auto.ps1 -PreRelease "beta.1"
```

### Manual

```powershell
# Specific version bump
.\scripts\update-version.ps1 patch
.\scripts\update-version.ps1 minor
.\scripts\update-version.ps1 major
```

## Complete Release Workflow

```bash
# 1. Make changes with conventional commits
git commit -m "[feat]: Add race strategy analyzer"
git commit -m "[fix]: Resolve timing accuracy issue"

# 2. Update version automatically
.\scripts\update-version-auto.ps1

# 3. Review changes
git diff turn-one-backend/VERSION turn-one-client/package.json CHANGELOG.md

# 4. Commit version bump
git add turn-one-backend/VERSION turn-one-client/package.json CHANGELOG.md
git commit -m "chore: bump version to 1.2.0"

# 5. Tag and push
git tag v1.2.0
git push && git push --tags
```

## Breaking Change Examples

```bash
# Option 1: Use [major] prefix
git commit -m "[major]: Change authentication flow"

# Option 2: Add ! after type
git commit -m "feat!: redesign telemetry API"

# Option 3: Include BREAKING CHANGE in body
git commit -m "[feat]: Update WebSocket protocol

BREAKING CHANGE: Message format changed from JSON to binary.
All clients must update their parsers."
```

## Tips

- ✅ **DO** use present tense: "Add feature" not "Added feature"
- ✅ **DO** be descriptive and clear
- ✅ **DO** reference issues: "Fixes #123"
- ✅ **DO** group related changes in one commit
- ❌ **DON'T** use vague messages like "update", "fix bug"
- ❌ **DON'T** mix unrelated changes in one commit

## More Information

- Full guide: [docs/COMMIT_CONVENTIONS.md](./COMMIT_CONVENTIONS.md)
- Versioning details: [docs/VERSIONING.md](./VERSIONING.md)
- Changelog: [CHANGELOG.md](../CHANGELOG.md)
