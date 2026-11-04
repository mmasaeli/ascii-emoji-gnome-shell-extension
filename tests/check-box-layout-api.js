#!/usr/bin/env -S gjs -m
// Regression check: verifies boxLayoutCompat.js picks a property
// (`vertical` vs `orientation`) that actually exists on St.BoxLayout for the
// GNOME Shell version this script runs under. Catches API breaks like GNOME
// 51 removing `St.BoxLayout`'s `vertical` property.
//
// Uses GObject introspection to read the typelib's property list directly,
// rather than constructing a real St.BoxLayout - that requires a live
// Mutter/Clutter compositor context, which plain `gjs` doesn't have (see
// .github/workflows/ci.yml for why this check doesn't need a running shell
// session).
//
// Usage: gjs -m tests/check-box-layout-api.js <gnome-shell-major-version>

import GIRepository from "gi://GIRepository?version=3.0";
import System from "system";

import { usesOrientationProperty } from "../boxLayoutCompat.js";

const shellMajorVersion = parseInt(ARGV[0], 10);

if (!Number.isInteger(shellMajorVersion)) {
  printerr("Usage: gjs -m tests/check-box-layout-api.js <gnome-shell-major-version>");
  System.exit(1);
}

const repo = GIRepository.Repository.dup_default();
repo.require("St", null, 0);

const boxLayoutInfo = repo.find_by_name("St", "BoxLayout");
const propertyNames = new Set();
for (let i = 0; i < boxLayoutInfo.get_n_properties(); i++) {
  propertyNames.add(boxLayoutInfo.get_property(i).get_name());
}

const chosenProperty = usesOrientationProperty(shellMajorVersion)
  ? "orientation"
  : "vertical";

if (!propertyNames.has(chosenProperty)) {
  printerr(
    `FAIL: boxLayoutCompat.js would use '${chosenProperty}' on GNOME Shell ` +
      `${shellMajorVersion}, but St.BoxLayout doesn't have that property. ` +
      `Available properties: ${[...propertyNames].join(", ")}`
  );
  System.exit(1);
}

print(
  `OK: GNOME Shell ${shellMajorVersion} - St.BoxLayout has '${chosenProperty}' ` +
    `(available: ${[...propertyNames].join(", ")})`
);
