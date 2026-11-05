# ASCII Emoji/Unicode Kaomoji GNOME Shell Extension

A GNOME Shell extension that lets you quickly search and copy Unicode Kaomoji/ASCII emojis from your panel.

The list of emojis is compiled from (https://asciimoji.com/)[https://asciimoji.com/].

## Features

- Search for emojis/Kaomoji by name or keyword.
- Copy emojis to **clipboard** with a single click.
- Simple and lightweight panel indicator.
- Remembers your most-used emojis and lists them first. The counts are stored in `~/.local/share/ascii-emoji@masood.masaeli/counts.json`, so they are kept across extension updates.

## Installation

1. Clone this repository:

   ```sh
   git clone https://github.com/mmasaeli/ascii-emoji-gnome-shell-extension.git
   ```

2. Copy the extension folder to your GNOME Shell extensions directory:

   ```sh
   cp -r ascii-emoji-gnome-shell-extension ~/.local/share/gnome-shell/extensions/ascii-emoji@masood.masaeli
   ```

3. Restart GNOME Shell:

   - Press <kbd>Alt</kbd> + <kbd>F2</kbd>, type `r`, and press <kbd>Enter</kbd> (on X11).
   - Or log out and log back in.

4. Enable the extension using GNOME Extensions app or `gnome-extensions` CLI:

   ```sh
   gnome-extensions enable ascii-emoji@masood.masaeli
   ```

## Usage

- Click the icon in your top panel.
- Type to search for an emoji.
- Click an emoji/Kaomoji to copy it to your clipboard.

## Development

- Main code: [`extension.js`](extension.js)
- Metadata: [`metadata.json`](metadata.json)
- Stylesheet: [`stylesheet.css`](stylesheet.css)
- `St.BoxLayout`'s `vertical`/`orientation` property choice: [`boxLayoutCompat.js`](boxLayoutCompat.js)
- Emoji list + persistent usage counts: [`storage.js`](storage.js)

The automated checks below (linting, API compatibility, storage test, Shexli) also run in CI on every push/PR (see [`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

### Linting

Requires [Node.js](https://nodejs.org/) and npm.

```sh
npm install     # one-time, installs ESLint into node_modules/
npm run lint    # or: npx eslint .
make lint       # same thing, via the Makefile
```

Uses the [GJS style guide](https://gjs.guide/guides/gjs/style-guide.html)'s ESLint config ([`eslint.config.js`](eslint.config.js)).

### GNOME Shell API compatibility check

GNOME Shell has changed `St.BoxLayout`'s layout-direction property across versions (`vertical` only in 46/47, both in 48-50, `orientation` only from 51). [`tests/check_box_layout_api.py`](tests/check_box_layout_api.py) verifies the property [`boxLayoutCompat.js`](boxLayoutCompat.js) picks actually exists on the real `St.BoxLayout` for a given version, by installing that version's real `gnome-shell` package in a throwaway [podman](https://podman.io/) container and checking it there - no running shell session needed.

Requires `podman`.

```sh
make test-46    # check against GNOME Shell 46 (ubuntu:24.04)
make test-48    # check against GNOME Shell 48 (debian:13)
make test-50    # check against GNOME Shell 50 (ubuntu:26.04)
make test-51    # check against GNOME Shell 51 (ubuntu:26.10)
make test-all   # all of the above
```

Each `make test-NN` target installs `gnome-shell` + PyGObject fresh inside the container (via [`tests/run-in-container.sh`](tests/run-in-container.sh)), so expect it to take a minute or two, not be instant.

**This is not a substitute for actually running the extension.** It only checks that the property our code picks exists on the real `St.BoxLayout` for that version - it doesn't construct the widget, load `extension.js`, or start a GNOME Shell session, so it can't catch things like a broken `import`, a JS exception in `enable()`, or a UI that doesn't render correctly. See "Manual release testing" below for that.

### Storage runtime test

[`tests/storage.test.js`](tests/storage.test.js) runs [`storage.js`](storage.js) under real `gjs` against temporary directories (your real data is never touched). It covers the "counts survive an update" behaviour, emojis added or removed by an update, a corrupt `counts.json`, and a missing emoji list. It exercises the real async `Gio` calls, so it catches breakage that static analysis can't.

```sh
make storage-test                # in a clean Ubuntu container via podman
gjs -m tests/storage.test.js     # or directly, if gjs is installed
```

### Shexli (extensions.gnome.org pre-review check)

[Shexli](https://pypi.org/project/shexli/) is a static analyzer for the packaging and review issues extensions.gnome.org flags. `make shexli` runs it on a staged copy holding exactly the files that ship in the zip, inside a pinned `python:3.12` container (a very new system Python can lack prebuilt wheels for one of its dependencies).

```sh
make shexli
```

Shexli always exits 0, so [`tests/check_shexli.py`](tests/check_shexli.py) gates on its JSON report and fails on any finding except two documented ones:

- `EGO-A-005` (clipboard needs reviewer scrutiny): allowed while `metadata.json`'s description declares clipboard use, as the review guidelines require.
- `EGO-M-004` (`shell-version` has a "future release"): Shexli 0.2.x hardcodes anything above GNOME 50 as implausible. Allowed only while every entry is a plain integer, so malformed versions still fail. Revisit when bumping the pinned Shexli version in [`tests/run-shexli.sh`](tests/run-shexli.sh).

The check also fails if a shipped `.js` file imports a file that is not in the package.

### Manual release testing

Before releasing a new version, manually verify the extension actually works in a live GNOME Shell session, for each major version in `metadata.json` you can get access to:

1. Symlink this repo into your extensions directory instead of copying it, so edits take effect without reinstalling:

   ```sh
   ln -sfn "$(pwd)" ~/.local/share/gnome-shell/extensions/ascii-emoji@masood.masaeli
   gnome-extensions enable ascii-emoji@masood.masaeli
   ```

2. Install `mutter-devkit` (one-time) - it gives `--devkit` a real window to draw a nested session into, instead of silently failing:

   ```sh
   sudo dnf install mutter-devkit      # Fedora
   sudo apt install mutter-devkit      # Debian/Ubuntu, if packaged for your release
   ```

3. Run a disposable nested session so you're not testing inside your real desktop:

   ```sh
   dbus-run-session -- gnome-shell --devkit     # GNOME Shell 49+
   ```

   (On older GNOME Shell, use `--nested` instead of `--devkit`, no extra package needed.)
4. In the nested window: click the panel icon, confirm the popup opens with no errors, type to filter, and click an emoji to confirm it copies to the clipboard.
5. Watch for errors while testing with `journalctl -f -o cat /usr/bin/gnome-shell` in another terminal.
6. Close the nested window (or `Ctrl+C` in its terminal) when done - it leaves your real session untouched.

We looked into automating this fully in CI (mocking GNOME Shell's system D-Bus dependencies, or a full systemd+Xvfb container, similar to [Simon Schneegans' approach](https://schneegans.github.io/tutorials/2022/02/28/gnome-shell-extensions-ci-01)) and deliberately deferred it - real session testing in CI is a meaningfully larger investment than the API compatibility check above, so for now it's a manual pre-release step instead.

### Packaging a release

```sh
make package
```

This runs, in order:

1. the linter,
2. the storage runtime test,
3. Shexli,
4. **a bump of the integer `version` in `metadata.json` by 1** (extensions.gnome.org requires a higher version for every upload),
5. the build of `dist/<uuid>.zip`, containing only the files GNOME Shell needs at runtime: `extension.js`, `boxLayoutCompat.js`, `storage.js`, `emojis.json`, `metadata.json` and `LICENSE`.

- Every successful run bumps the version, including local test builds. If any check fails, nothing is bumped or built.
- Commit the bumped `metadata.json` together with the release.
- Needs `podman` (for the container-based checks), Node.js and `zip`.
- To try the zip locally: `gnome-extensions install --force dist/*.zip`, then log out and back in (Wayland) or restart the shell (X11).
- To publish, upload the zip at <https://extensions.gnome.org/upload/>.
- `make clean` removes the `dist/` folder.

The checks do not replace the "Manual release testing" steps above: follow those before packaging.

## License

MIT License. See [`LICENSE`](LICENSE) for details.

---

Inspired by the need for quick ASCII emoji access on GNOME Shell.
