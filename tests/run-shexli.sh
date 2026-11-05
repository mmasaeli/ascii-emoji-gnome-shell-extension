#!/usr/bin/env bash
# Runs the Shexli static analyzer (the extensions.gnome.org pre-review check)
# on a package directory, then gates on the result with check_shexli.py.
#
# Needs python3 with venv + network access (pip). Meant to run in a
# python:3.12 container locally (see Makefile) and on the CI runner.
# A recent system Python (e.g. 3.15) can lack prebuilt tree-sitter wheels,
# which shexli depends on - hence the pinned, containerised Python.
#
# Usage: run-shexli.sh <package-dir>
set -euo pipefail

# Pinned so a new Shexli release adding rules can't break CI unannounced.
# Bump deliberately, then re-check the allow-list in tests/check_shexli.py.
SHEXLI_VERSION=0.2.1

package_dir=$(realpath "$1")
here=$(cd "$(dirname "$0")" && pwd)
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

python3 -m venv "$work/venv"
"$work/venv/bin/pip" install -q "shexli==$SHEXLI_VERSION"
"$work/venv/bin/shexli" --format json "$package_dir" > "$work/report.json"
"$work/venv/bin/shexli" "$package_dir" || true   # human-readable copy for the log
python3 "$here/check_shexli.py" "$work/report.json" "$package_dir"
