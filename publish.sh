#!/usr/bin/env sh
# Build, commit, and push — Cloudflare Pages deploys on push to main.
# Usage:  ./publish.sh ["commit message"]   or   npm run publish -- "message"
# Authored by Karter with Claude Opus 4.8
set -e

# Commit message: first argument, or a dated default.
msg="${1:-Publish $(date '+%Y-%m-%d %H:%M')}"

# Build first so a broken build stops us before anything is pushed.
npm run build

# Nothing changed? Stop cleanly. (dist/ is gitignored; this sees source edits.)
if [ -z "$(git status --porcelain)" ]; then
  echo "No changes to publish."
  exit 0
fi

git add -A
git commit -m "$msg"
git push
echo "Published: $msg"
