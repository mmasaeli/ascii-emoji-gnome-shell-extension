#!/usr/bin/env bash
# Installs gjs (if missing) and runs the storage runtime test.
# Meant for an apt-based container (see Makefile / .github/workflows/ci.yml).
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v gjs >/dev/null; then
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  apt-get install -y -qq gjs
fi

gjs --version
exec gjs -m tests/storage.test.js
