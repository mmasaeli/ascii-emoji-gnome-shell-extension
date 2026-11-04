#!/usr/bin/env -S gjs -m
// Regression check: verifies boxLayoutCompat.js's property choice (`vertical`
// vs `orientation`) actually works against the REAL St/Clutter typelibs for
// the GNOME Shell version this script is run under. Catches API breaks like
// GNOME 51 removing `St.BoxLayout`'s `vertical` property, without needing a
// running shell session (see .github/workflows/ci.yml for how each version
// is tested).
//
// Usage: gjs -m tests/check-box-layout-api.js <gnome-shell-major-version>

import St from "gi://St";
import Clutter from "gi://Clutter";
import System from "system";

import { newBoxLayout, usesOrientationProperty } from "../boxLayoutCompat.js";

const shellMajorVersion = parseInt(ARGV[0], 10);

if (!Number.isInteger(shellMajorVersion)) {
  printerr("Usage: gjs -m tests/check-box-layout-api.js <gnome-shell-major-version>");
  System.exit(1);
}

try {
  newBoxLayout(St, Clutter, shellMajorVersion, true, {});
  newBoxLayout(St, Clutter, shellMajorVersion, false, { x_expand: true });
  print(
    `OK: St.BoxLayout works on GNOME Shell ${shellMajorVersion} via ` +
      `'${usesOrientationProperty(shellMajorVersion) ? "orientation" : "vertical"}'`
  );
} catch (e) {
  printerr(`FAIL: St.BoxLayout broke on GNOME Shell ${shellMajorVersion}: ${e}`);
  System.exit(1);
}
