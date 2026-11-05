# ASCII Emoji GNOME Shell extension

Panel indicator to search and copy Kaomoji/ASCII emojis.
(see `shell-version` in `metadata.json`). Published on extensions.gnome.org.

## Layout

- `extension.js`: panel indicator and UI.
- `boxLayoutCompat.js`: BoxLayout constructor compat across Shell versions.
- `storage.js`: loads the bundled `emojis.json`, keeps usage counts in the user data dir (`counts.json`, written at runtime, never shipped).
- `emojis.json`: bundled emoji list.
- `tests/`: container-based checks (box-layout API per Shell version, Shexli, storage under real gjs).

## Commands

- `make lint`: eslint (`npm run lint`).
- `make storage-test`: runs `storage.js` under gjs in podman.
- `make test-<NN>` / `make test-all`: box-layout API check per Shell version (podman). Keep the version-to-image mapping in the `Makefile` in sync with `.github/workflows/ci.yml`.
- `make shexli`: runs the Shexli static analyzer on a staged copy of exactly the shipped files.
- `make package`: lint, storage-test, shexli, then bumps `version` in `metadata.json`, then builds `dist/<uuid>.zip`. Checks run before the bump so a failure never burns a version number.

## Packaging rules

- The zip contents come from `PACKAGE_FILES` in the `Makefile`. It is hand-maintained: when you add a runtime file (new import, `stylesheet.css`, `prefs.js`, `schemas/`, `locale/`), add it there, or it will silently be missing from the zip and from the Shexli stage.
- Review Guidelines: don't include unnecessary files (build/install scripts, `.po`/`.pot`, unused media); a GSettings schema XML must be in the zip if used. Tests, CI config, `node_modules`, docs and lockfiles stay out.
- Uploads go through https://extensions.gnome.org/upload/ (login required) and are manually reviewed; the result is emailed. Later versions use the same form. Uploading means agreeing that staff may remove, modify or reassign the extension.
- Shexli can also be run on the final zip: `pip install -U shexli && shexli path/to/zip_or_folder` (the upload page recommends this).
- `metadata.json` `version`: the Makefile bumps it on `make package` (project convention). The Review Guidelines call this field deprecated and "set for internal use by extensions.gnome.org", so the bump is not documented as an upload requirement. Unverified whether e.g.o rejects a repeated value.

## Review Guidelines that apply here

Source: https://gjs.guide/extensions/review-guidelines/review-guidelines.html (re-check it; it changes).

- No GObject classes (`Gio.Settings`, `St.Widget`, ...) or signals/sources/Shell changes during initialization (module import and the Extension constructor). Create them in `enable()`.
- `disable()` MUST destroy created objects, disconnect all signals and remove all main loop sources, even ones whose callback returns `GLib.SOURCE_REMOVE`. Dynamic data in module scope must be cleared.
- MUST NOT import `Gdk`, `Gtk` or `Adw` in the Shell process.
- Code must be readable, not minified or obfuscated. No binaries or libraries in the zip.
- No deprecated modules (`ByteArray`, `Lang`, `Mainloop`). No excessive logging.
- Clipboard use MUST be declared in the description (it is). No default clipboard shortcuts, no sharing clipboard data.
- `metadata.json`: `shell-version` only stable releases plus at most one development release; `url` should be a GitHub/GitLab repo; no unnecessary keys.
- Emojis, text and screenshots must not violate the Code of Conduct.
- AI-assisted code is allowed, but the author must be able to justify it. Reviewers reject imaginary APIs and unnecessary code.
- Not in the guidelines: a rule on sync vs async I/O (we use async Gio anyway, guarded by `make storage-test`), and a LICENSE-file requirement (we ship one anyway).
