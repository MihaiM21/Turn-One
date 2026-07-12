# Versioning Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TURN ONE VERSIONING WORKFLOW                     │
└─────────────────────────────────────────────────────────────────────────┘

1. DEVELOPMENT PHASE
   ┌──────────────────────────────────────────────────────────────────┐
   │  Developer makes changes and commits with conventional format    │
   │                                                                  │
   │  git commit -m "[feat]: Add race strategy analyzer"             │
   │  git commit -m "[fix]: Resolve telemetry sync issue"            │
   │  git commit -m "[perf]: Optimize WebSocket handling"            │
   └──────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
2. VERSION ANALYSIS
   ┌──────────────────────────────────────────────────────────────────┐
   │  Run automated version update script                             │
   │                                                                  │
   │  .\scripts\update-version-auto.ps1                              │
   │                                                                  │
   │  Script analyzes commits:                                        │
   │  ├─ [feat] found    → Triggers MINOR bump                       │
   │  ├─ [fix] found     → Triggers PATCH bump                       │
   │  ├─ [major] found   → Triggers MAJOR bump                       │
   │  └─ Highest priority determines final bump                      │
   └──────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
3. VERSION CALCULATION
   ┌──────────────────────────────────────────────────────────────────┐
   │  Current: 0.1.2                                                  │
   │                                                                  │
   │  Analysis:                                                       │
   │  ✨ 1 Feature ([feat])          → MINOR bump needed             │
   │  🐛 1 Fix ([fix])               → PATCH bump needed             │
   │  ⚡ 1 Performance ([perf])      → PATCH bump needed             │
   │                                                                  │
   │  Decision: MINOR bump (highest priority)                        │
   │  New Version: 0.2.0                                             │
   └──────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
4. FILE UPDATES
   ┌──────────────────────────────────────────────────────────────────┐
   │  Automated updates to:                                           │
   │                                                                  │
   │  ✅ turn-one-backend/VERSION                                    │
   │     0.1.2 → 0.2.0                                               │
   │                                                                  │
   │  ✅ turn-one-client/package.json                                │
   │     "version": "0.1.2" → "version": "0.2.0"                     │
   │                                                                  │
   │  ✅ CHANGELOG.md                                                │
   │     + New entry with categorized changes                        │
   └──────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
5. CHANGELOG GENERATION
   ┌──────────────────────────────────────────────────────────────────┐
   │  ## [0.2.0] - 2024-12-15                                        │
   │                                                                  │
   │  ### ✨ Features                                                │
   │  - Add race strategy analyzer (a1b2c3d)                         │
   │                                                                  │
   │  ### 🐛 Bug Fixes                                               │
   │  - Resolve telemetry sync issue (e4f5g6h)                       │
   │                                                                  │
   │  ### ⚡ Performance                                             │
   │  - Optimize WebSocket handling (i7j8k9l)                        │
   └──────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
6. COMMIT & TAG
   ┌──────────────────────────────────────────────────────────────────┐
   │  Commit the version changes:                                     │
   │                                                                  │
   │  git add turn-one-backend/VERSION \                             │
   │          turn-one-client/package.json \                         │
   │          CHANGELOG.md                                           │
   │                                                                  │
   │  git commit -m "chore: bump version to 0.2.0"                   │
   │                                                                  │
   │  git tag v0.2.0                                                 │
   │                                                                  │
   │  git push && git push --tags                                    │
   └──────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
7. DEPLOYMENT (Optional)
   ┌──────────────────────────────────────────────────────────────────┐
   │  CI/CD pipeline triggered by tag:                                │
   │                                                                  │
   │  ├─ Build Docker images with version tag                        │
   │  ├─ Run tests                                                    │
   │  ├─ Deploy to staging                                            │
   │  └─ Deploy to production (manual approval)                      │
   └──────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════

COMMIT TYPE DECISION TREE

                        ┌─────────────────┐
                        │  Commit Type?   │
                        └────────┬────────┘
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
                ▼                ▼                ▼
         ┌──────────┐     ┌──────────┐    ┌──────────┐
         │ Breaking │     │ Feature  │    │   Fix    │
         │  Change  │     │  [feat]  │    │  [fix]   │
         └────┬─────┘     └────┬─────┘    └────┬─────┘
              │                │                │
              ▼                ▼                ▼
         ┌──────────┐     ┌──────────┐    ┌──────────┐
         │  MAJOR   │     │  MINOR   │    │  PATCH   │
         │  x.0.0   │     │  x.y.0   │    │  x.y.z   │
         └──────────┘     └──────────┘    └──────────┘
         │                │                │
         │  Examples:     │  Examples:     │  Examples:
         │  [major]       │  [feat]        │  [fix]
         │  BREAKING      │  feat:         │  fix:
         │  feat!:        │  [feature]     │  [perf]
         └────────────────┴────────────────┴──────────────


═══════════════════════════════════════════════════════════════════════════

VERSION BUMP PRIORITY

When multiple commit types exist in the same release:

    ┌─────────────────────────────────────────┐
    │  Priority (Highest to Lowest)           │
    ├─────────────────────────────────────────┤
    │  1. 💥 BREAKING CHANGE / [major]        │ → MAJOR bump
    │                                         │
    │  2. ✨ [feat] / feat:                   │ → MINOR bump
    │                                         │
    │  3. 🐛 [fix] / [perf] / fix: / perf:   │ → PATCH bump
    │                                         │
    │  4. 📝 Other (docs, chore, style, etc)  │ → No bump
    └─────────────────────────────────────────┘

Example: If you have [feat] and [fix] commits, result is MINOR bump.


═══════════════════════════════════════════════════════════════════════════

SCRIPT OPTIONS FLOW

    ┌──────────────────────────────────────────┐
    │  update-version-auto.ps1                 │
    └────────────────┬─────────────────────────┘
                     │
         ┌───────────┼───────────┬──────────────┐
         │           │           │              │
         ▼           ▼           ▼              ▼
    ┌────────┐  ┌────────┐  ┌────────┐    ┌────────┐
    │ Normal │  │ DryRun │  │ Force  │    │ Range  │
    └────┬───┘  └────┬───┘  └────┬───┘    └────┬───┘
         │           │           │              │
         ▼           ▼           ▼              ▼
    Updates     Shows what   Forces bump    Analyzes
    files       would        even without   specific
    and         change       conventional   commit
    creates     without      commits        range
    changelog   modifying
                files


═══════════════════════════════════════════════════════════════════════════

EXAMPLE SCENARIO

Scenario: Preparing Release 0.2.0

    Week 1: Development
    ├─ Mon: [feat]: Add user dashboard
    ├─ Tue: [feat]: Implement notifications
    ├─ Wed: [fix]: Correct data validation
    ├─ Thu: [docs]: Update API docs
    └─ Fri: [fix]: Resolve login issue

    Friday EOD: Version Update
    ├─ Run: .\scripts\update-version-auto.ps1
    ├─ Analysis:
    │  ├─ 2 Features → MINOR bump needed
    │  ├─ 2 Fixes → PATCH bump needed
    │  └─ Decision: MINOR (higher priority)
    ├─ Result: 0.1.2 → 0.2.0
    └─ Changelog:
       ├─ ✨ Features (2)
       ├─ 🐛 Bug Fixes (2)
       └─ 🔧 Other Changes (1)

    Commit & Deploy
    └─ Tag v0.2.0 → Triggers CI/CD


═══════════════════════════════════════════════════════════════════════════

FILE STRUCTURE

turn-one/
├── CHANGELOG.md                              [Auto-generated changelog]
├── ReadMe.md                                 [Project documentation]
│
├── turn-one-backend/
│   └── VERSION                               [Backend version: 0.1.2]
│
├── turn-one-client/
│   └── package.json                          [Frontend version: 0.1.2]
│
├── scripts/
│   ├── update-version.ps1                    [Manual version bump]
│   ├── update-version.sh                     [Manual version bump (bash)]
│   ├── update-version-auto.ps1               [Automated version bump]
│   └── update-version-auto.sh                [Automated version bump (bash)]
│
└── docs/
    ├── VERSIONING.md                         [Version management guide]
    ├── VERSIONING_SYSTEM_SUMMARY.md          [Implementation summary]
    ├── COMMIT_CONVENTIONS.md                 [Commit message standards]
    ├── COMMIT_TEMPLATES.md                   [Ready-to-use templates]
    ├── COMMIT_VALIDATION.md                  [Validation setup]
    └── QUICK_REFERENCE_VERSIONING.md         [Quick cheat sheet]


═══════════════════════════════════════════════════════════════════════════
```
