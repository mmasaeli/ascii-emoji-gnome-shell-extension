#!/usr/bin/env bash
# Installs gnome-shell + PyGObject, locates the real St/Clutter typelibs it
# just installed, then runs the St.BoxLayout API check against them for the
# given GNOME Shell major version.
#
# Meant to run *inside* an apt-based (Ubuntu/Debian) container for that
# distro (see the Makefile for local use via podman, and
# .github/workflows/ci.yml for CI) - this is the one place that logic lives,
# so local runs and CI can't drift apart.
#
# Usage: run-in-container.sh <gnome-shell-major-version>
set -euo pipefail

shell_version=$1

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq gnome-shell findutils python3-gi

GI_TYPELIB_PATH=$(find / -xdev -name '*.typelib' 2>/dev/null \
  | xargs -n1 dirname | sort -u | paste -sd: -)
LD_LIBRARY_PATH=$(find / -xdev \( -iname 'libst-*.so*' -o -iname 'libmutter-*.so*' \) 2>/dev/null \
  | xargs -n1 dirname | sort -u | paste -sd: -)

echo "GI_TYPELIB_PATH=$GI_TYPELIB_PATH"
echo "LD_LIBRARY_PATH=$LD_LIBRARY_PATH"

export GI_TYPELIB_PATH LD_LIBRARY_PATH
exec python3 tests/check_box_layout_api.py "$shell_version"
