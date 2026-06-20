#!/usr/bin/env bash
# Publish @jgalbsss/pyrojs to npm.
#
# The account has 2FA enabled, so you need EITHER:
#   • an npm "Automation" access token (bypasses 2FA), set as NPM_TOKEN, or
#   • a one-time password passed through, e.g. scripts/publish.sh --otp=123456
#
# Examples:
#   NPM_TOKEN=npm_xxx bash scripts/publish.sh
#   NPM_TOKEN=npm_xxx bash scripts/publish.sh --otp=123456
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
: "${NPM_TOKEN:?Set NPM_TOKEN to an npm Automation token (npmjs.com -> Access Tokens -> Generate -> Automation)}"

NPMRC="$(mktemp)"
trap 'rm -f "$NPMRC"' EXIT
printf '//registry.npmjs.org/:_authToken=%s\n' "$NPM_TOKEN" > "$NPMRC"

echo "▶ building @jgalbsss/pyrojs"
pnpm --filter @jgalbsss/pyrojs build

echo "▶ publishing @jgalbsss/pyrojs"
( cd "$ROOT/packages/pyrojs" && npm publish --userconfig "$NPMRC" --access public "$@" )
echo "✓ done"
