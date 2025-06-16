# ASCII Emoji GNOME Shell Extension

A GNOME Shell extension that lets you quickly search and copy ASCII emojis from your panel.

The list of emojis is compiled from (https://asciimoji.com/)[https://asciimoji.com/].

## Features

- Search for ASCII emojis by name or keyword.
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

- Click the ASCII Emoji icon in your top panel.
- Type to search for an emoji.
- Click an emoji to copy it to your clipboard.

## Development

- Main code: [`extension.js`](extension.js)
- Metadata: [`metadata.json`](metadata.json)
- Stylesheet: [`stylesheet.css`](stylesheet.css)

## License

MIT License. See [`LICENSE`](LICENSE) for details.

---

Inspired by the need for quick ASCII emoji access on GNOME Shell.