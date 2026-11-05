#!/usr/bin/env python3
"""Regression check: verifies the property boxLayoutCompat.js picks
(`vertical` vs `orientation`) actually exists on St.BoxLayout for the real
GNOME Shell version this runs under. Catches API breaks like GNOME 51
removing St.BoxLayout's `vertical` property.

Uses GObject.list_properties(), a class-level query that needs no live
Clutter/Mutter compositor context (unlike constructing a real St.BoxLayout,
which crashes outside a running shell session) and - unlike gjs's GIRepository
binding - stays consistent across the GIRepository 2.0/3.0 split that spans
our supported GNOME Shell versions.

The `uses_orientation_property` threshold mirrors boxLayoutCompat.js (plain
Python here since that file is an ES module meant for gjs/GNOME Shell) -
keep the two in sync.

Usage: check_box_layout_api.py <gnome-shell-major-version>
"""

import sys

from gi.repository import GObject, St


def uses_orientation_property(shell_major_version):
    return shell_major_version >= 48


def main():
    if len(sys.argv) != 2:
        sys.exit("Usage: check_box_layout_api.py <gnome-shell-major-version>")

    shell_major_version = int(sys.argv[1])
    chosen_property = (
        "orientation"
        if uses_orientation_property(shell_major_version)
        else "vertical"
    )

    names = sorted(p.name for p in GObject.list_properties(St.BoxLayout))

    if chosen_property not in names:
        sys.exit(
            f"FAIL: boxLayoutCompat.js would use '{chosen_property}' on GNOME "
            f"Shell {shell_major_version}, but St.BoxLayout doesn't have that "
            f"property. Available properties: {names}"
        )

    print(
        f"OK: GNOME Shell {shell_major_version} - St.BoxLayout has "
        f"'{chosen_property}' (available: {names})"
    )


if __name__ == "__main__":
    main()
