# Secret rotation runbook (H-01)

**Why:** the production JWT signing key was committed to `turn-one-backend/API/appsettings.json`
in commits `3c377e2` (2025-09-11), `0f353cb` (2025-10-25) and `f6c6b1e` (2025-10-24). They are on
`dev`, `master` and most other branches of a **public** repository (`MihaiM21/Turn-One`), so the
key must be treated as known to anyone. With it, anyone can mint a token for any user id with
`Role=ADMIN`. The same key is also used by the frontend (`JWT_SECRET` in `docker-compose.yml`).
The SMTP password is in the local stash `103ec0d` (not pushed, but rotate it anyway).

Rotating the key is what fixes this. Purging history is hygiene that comes after — the key was
public for over a year, so purging without rotating fixes nothing.

## 1. Rotate the JWT key (do first, today)

1. Generate a new key per environment (never reuse between dev / staging / prod):
   ```bash
   openssl rand -base64 48
   ```
2. In Coolify, set `JWT__Key` for the **production** stack to the new value. `docker-compose.yml`
   passes the same variable to the client as `JWT_SECRET`, so both pick it up on redeploy.
3. Do the same with a different value for dev/staging and in your local `.env` files.
4. Redeploy. The API now refuses to start outside Development with a key shorter than 32 characters.
5. **Effect:** every existing token is invalid — every user, the Link and overlays are signed out
   once. Post a short notice (site banner / Discord) before deploying.
6. Check: an old token gets `401` on `GET /api/auth/me`; a fresh login works.

## 2. Rotate the SMTP password

Change it with the mail provider, set `SmtpSettings__Password` in Coolify, redeploy, send a test
password-reset email.

## 3. Check the admin account

The old startup seed created `mihai@t1f1.com` with password `default123` if it didn't exist.
The API now logs a **Fatal** line at startup if any admin still has that password. Change it
from the website (forgot-password flow) before or right after the deploy. New admins are created
only from configuration (`Admin__BootstrapEmail`, `Admin__BootstrapPassword` ≥ 16 chars) and only
while no admin exists — unset both afterwards.

## 4. Purge history (after 1–3, coordinated)

This rewrites every commit hash from 2025-09-11 on. Open PRs break, every clone must be re-cloned
or hard-reset, and the existing worktrees (`.claude/worktrees/*`) must be recreated.

1. Land or stash the uncommitted work on `chore/post-paywall-hygiene` first.
2. Fresh mirror clone, outside the working copy:
   ```bash
   git clone --mirror https://github.com/MihaiM21/Turn-One.git turn-one-purge.git
   ```
3. Create `replacements.txt` with one line per leaked value: `<old value>==>REMOVED`
   (the old JWT key, old SMTP password). Never commit this file.
4. Rewrite:
   ```bash
   cd turn-one-purge.git
   git filter-repo --replace-text ../replacements.txt
   ```
5. Verify nothing remains: `git log --all -p | grep -c "<first 12 chars of old key>"` → `0`.
6. Force-push all branches and tags: `git push --force --mirror`.
7. Ask GitHub Support to purge cached views and PR refs for the old commits
   (GitHub keeps `refs/pull/*` and cached commit pages otherwise).
8. Delete `stash@{0}` locally (`git stash drop`) — it contains the SMTP password.
9. Re-clone everywhere (Coolify builds from GitHub, so it just follows).

## 5. Keep it from happening again

- `secret-scan` job (gitleaks) runs on every push and PR in `.github/workflows/pipeline.yml`.
  Until step 4 is done, a manual full-history scan will report the old commits — expected.
- `appsettings*.json` stay gitignored; all secrets come from environment variables.
