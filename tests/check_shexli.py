#!/usr/bin/env python3
"""Gate for Shexli's JSON report (shexli always exits 0, so CI can't rely on
its exit code). Fails on any finding except the narrowly-scoped, justified
exceptions below, and also checks the package is self-contained.

Usage: check_shexli.py <shexli-report.json> <package-dir>

<package-dir> is the folder that was analysed (the exact set of files that
ships in the zip).
"""

import ast
import json
import re
import sys
from pathlib import Path

report_path, package_dir = sys.argv[1], Path(sys.argv[2])
report = json.loads(Path(report_path).read_text())
metadata = json.loads((package_dir / "metadata.json").read_text())

problems = []


def allow_clipboard(finding):
    # EGO-A-005 is a "reviewer will look at this" note, not a defect. The
    # review guidelines only require that clipboard access is *declared*, so
    # allow it exactly as long as the description declares it.
    return "clipboard" in metadata.get("description", "").lower()


def allow_future_shell_version(finding):
    # EGO-M-004 fires for `major > 50` (hardcoded in shexli 0.2.x, so every
    # newer GNOME release is a "future release"). Allow it only when it can
    # be nothing else: every entry is a plain integer string, so there are no
    # invalid values and no development releases (those need x.alpha/beta/rc).
    # Anything malformed in shell-version still fails.
    # Re-evaluate when bumping the pinned shexli version.
    versions = metadata.get("shell-version", [])
    return bool(versions) and all(
        isinstance(v, str) and re.fullmatch(r"\d+", v) for v in versions
    )


ALLOWED = {
    "EGO-A-005": allow_clipboard,
    "EGO-M-004": allow_future_shell_version,
}

for finding in report["findings"]:
    rule = finding["rule_id"]
    check = ALLOWED.get(rule)
    where = finding["evidence"][0] if finding["evidence"] else {}
    location = f'{Path(where.get("path", "")).name.split(":")[-1]}:{where.get("line")}'
    if check and check(finding):
        print(f"allowed  {rule} ({finding['severity']}) {location}")
    else:
        problems.append(f"{rule} ({finding['severity']}) {location}: {finding['message']}")

# Every relative import in the shipped JS must itself be in the package, or
# the extension would fail to load after install (shexli only flags the
# opposite: files that nothing imports).
for js in package_dir.rglob("*.js"):
    for target in re.findall(r'''from\s+["'](\.{1,2}/[^"']+)["']''', js.read_text()):
        if not (js.parent / target).resolve().is_file():
            problems.append(f"{js.name} imports {target}, which is not in the package")

if problems:
    print("\nShexli check FAILED:")
    for p in problems:
        print(f"  - {p}")
    sys.exit(1)
print("\nShexli check passed")
