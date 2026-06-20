#!/usr/bin/env bash
# Run agent-doctor (https://github.com/JGalbss/agent-doctor) over the Effect
# source to keep the code idiomatic. Prefers a locally built binary, then a
# PATH install, then npx. Pass extra flags through, e.g.:
#   scripts/doctor.sh --agent           # flag non-idiomatic "agent slop"
#   scripts/doctor.sh --scope changed   # only files changed vs main
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="${PYRO_DOCTOR_TARGET:-$ROOT/packages/pyrojs/src}"

LOCAL_BIN="${AGENT_DOCTOR_BIN:-$ROOT/../effect-doctor/target/release/agent-doctor}"

run_doctor() {
  if [[ -x "$LOCAL_BIN" ]]; then
    "$LOCAL_BIN" "$@"
  elif command -v agent-doctor >/dev/null 2>&1; then
    agent-doctor "$@"
  else
    npx --yes agent-doctor "$@"
  fi
}

echo "▶ agent-doctor scanning: $TARGET"
run_doctor "$TARGET" "$@"
