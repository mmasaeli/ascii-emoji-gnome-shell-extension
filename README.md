# ASCII Emoji/Unicode Kaomoji GNOME Shell Extension

A GNOME Shell extension that lets you quickly search and copy Unicode Kaomoji/ASCII emojis from your panel.

The list of emojis is compiled from (https://asciimoji.com/)[https://asciimoji.com/].

## Features

- Search for emojis/Kaomoji by name or keyword.
- Copy emojis to **clipboard** with a single click.
- Simple and lightweight panel indicator.

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

Both checks below also run automatically in CI on every push/PR (see [`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

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

## License

MIT License. See [`LICENSE`](LICENSE) for details.

---

Inspired by the need for quick ASCII emoji access on GNOME Shell.
