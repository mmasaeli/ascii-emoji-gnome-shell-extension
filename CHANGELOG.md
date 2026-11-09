# Changelog

All notable changes to this extension are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions are the
single integers used by extensions.gnome.org (`version` in `metadata.json`).

## [8] - 2026-11-05

### Fixed

- **Usage counts are no longer reset by updates.** They used to be saved inside
  the extension's own folder, which GNOME replaces on every update, so the
  most-used-first ordering started over each time. They are now stored in
  `~/.local/share/ascii-emoji@masood.masaeli/counts.json`, outside the
  extension folder, and survive updates and reinstalls.
- **Fixed a break on GNOME Shell 51**, which removed the `vertical` property of
  `St.BoxLayout`. The extension now uses the right property for the Shell
  version it runs on.
- The panel icon is vertically centred and the popup opens centred below it
  (contributed by nDavis, [#4](https://github.com/mmasaeli/ascii-emoji-gnome-shell-extension/pull/4)).
- A failed read of the emoji list no longer leaves the extension without data.
  It falls back to an empty list and logs the error.
- A corrupt `counts.json` no longer breaks loading. Counts reset to zero and
  the next save repairs the file.

### Added

- Support for **GNOME Shell 51**. Supported versions are now 46-51.

### Changed

- The emoji list and counts are read and written asynchronously, so GNOME
  Shell no longer waits on disk. The list may appear a moment after the shell
  starts.
- Logging uses `console.error` instead of the deprecated `logError`.
- The bundled `emojis.json` is now read-only data: it no longer contains
  `count` fields. Your counts live only in `counts.json`.

### Upgrade notes

- **Your counts from v7 and earlier are not carried over.** They lived in the
  old file inside the extension folder, which this update overwrites. Counting
  starts fresh once; every later update keeps your counts.
- Counts are matched to emojis by their `name`. Emojis added by future updates
  appear automatically with a count of 0, and renaming an emoji in the list
  would reset its count.

### Internal

- Storage logic moved into its own module, `storage.js`.
- Added ESLint, a GNOME Shell API compatibility check (46, 48, 50, 51), a
  runtime storage test under `gjs`, and the Shexli pre-review analyzer, all
  run in CI.
- Added `make package`, which runs the checks, bumps `version` and builds the
  upload zip containing only the files the extension needs.
- Expanded the README (development, testing and packaging docs).

## [7]

Earlier versions are not documented here. See the
[git history](https://github.com/mmasaeli/ascii-emoji-gnome-shell-extension/commits/main).

