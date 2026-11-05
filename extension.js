import St from "gi://St";
import GObject from "gi://GObject";
import Gio from "gi://Gio";
import GLib from "gi://GLib";
import Clutter from "gi://Clutter";

import {
  Extension,
  gettext as _,
} from "resource:///org/gnome/shell/extensions/extension.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as Config from "resource:///org/gnome/shell/misc/config.js";

import { newBoxLayout as _newBoxLayout } from "./boxLayoutCompat.js";

const SHELL_MAJOR_VERSION = parseInt(Config.PACKAGE_VERSION.split(".")[0], 10);

function newBoxLayout(vertical, props = {}) {
  return _newBoxLayout(St, Clutter, SHELL_MAJOR_VERSION, vertical, props);
}

const Indicator = GObject.registerClass(
  class Indicator extends PanelMenu.Button {
    _init() {
      super._init(0.5, _("ASCII Emoji"));

      this.add_child(
        new St.Label({
          text: "(◉‿◉)",
          style_class: "system-status-icon",
          y_align: Clutter.ActorAlign.CENTER,
        })
      );

      this.searchEntry = new St.Entry({
        name: "searchEntry",
        hint_text: _("Type to search..."),
        track_hover: true,
        x_expand: true,
        can_focus: true,
      });
      this.menu.box.add_child(this.searchEntry);
      this.searchEntry
        .get_clutter_text()
        .connect("text-changed", this._refreshItems.bind(this));

      this._scrollView = new St.ScrollView({
        style_class: "vfade",
        overlay_scrollbars: true,
        x_expand: true,
      });
      this.menu.box.add_child(this._scrollView);

      this._listBox = newBoxLayout(true);
      this._scrollView.add_child(this._listBox);

      this.clipboard = St.Clipboard.get_default();

      this._emojiData = loadEmojiData();
      this._refreshItems();
    }

    _refreshItems() {
      this._listBox.destroy_all_children();

      const query = this.searchEntry.get_text().toLowerCase();

      const matchedEmojis = this._emojiData.filter((emoji) =>
        emoji.keyword.toLowerCase().includes(query)
      );

      matchedEmojis.forEach((emoji) => {
        let drawing = newBoxLayout(false, { x_expand: true });

        let nameLabel = new St.Label({
          text: emoji.name,
          x_expand: true,
        });

        let emojiLabel = new St.Label({
          text: emoji.emoji,
          x_expand: true,
        });

        drawing.add_child(nameLabel);
        drawing.add_child(emojiLabel);

        let item = new PopupMenu.PopupBaseMenuItem();
        item.add_child(drawing);

        item.connect("activate", () => {
          this.searchEntry.set_text("");
          this.clipboard.set_text(St.ClipboardType.CLIPBOARD, emoji.emoji);
          emoji.count += 1;
          this._emojiData.sort((a, b) => b.count - a.count);
          saveEmojiData(this._emojiData);
          this._refreshItems();
        });
        this._listBox.add_child(item);
      });
    }
  }
);

export default class AsciiEmojiExtension extends Extension {
  enable() {
    this._indicator = new Indicator();
    Main.panel.addToStatusArea(this.uuid, this._indicator);
  }

  disable() {
    this._indicator.destroy();
    this._indicator = null;
  }
}

// The bundled emoji list ships with the extension and is replaced on every
// update, so it is treated as read-only.
const BUNDLED_DATA_PATH = GLib.build_filenamev([
  GLib.path_get_dirname(GLib.filename_from_uri(import.meta.url)[0]),
  "emojis.json",
]);

// User state (usage counts) lives outside the extension directory so that it
// survives updates and reinstalls.
const USER_DATA_DIR = GLib.build_filenamev([
  GLib.get_user_data_dir(),
  "ascii-emoji@masood.masaeli",
]);
const COUNTS_FILE_PATH = GLib.build_filenamev([USER_DATA_DIR, "counts.json"]);

function readJson(path) {
  const file = Gio.File.new_for_path(path);
  const [ok, content] = file.load_contents(null);
  return ok ? JSON.parse(new TextDecoder().decode(content)) : null;
}

function loadCounts() {
  try {
    if (GLib.file_test(COUNTS_FILE_PATH, GLib.FileTest.EXISTS))
      return readJson(COUNTS_FILE_PATH) ?? {};
  } catch (e) {
    console.error("Failed to load emoji counts", e);
  }
  return {};
}

function loadEmojiData() {
  let data = [];
  try {
    data = readJson(BUNDLED_DATA_PATH) ?? [];
  } catch (e) {
    console.error("Failed to load emoji data", e);
  }
  const counts = loadCounts();
  data.forEach((emoji) => {
    emoji.count = counts[emoji.name] ?? emoji.count ?? 0;
  });
  data.sort((a, b) => b.count - a.count);
  return data;
}

function saveEmojiData(data) {
  try {
    GLib.mkdir_with_parents(USER_DATA_DIR, 0o755);
    const counts = {};
    data.forEach((emoji) => {
      if (emoji.count > 0) counts[emoji.name] = emoji.count;
    });
    Gio.File.new_for_path(COUNTS_FILE_PATH).replace_contents(
      JSON.stringify(counts),
      null,
      false,
      Gio.FileCreateFlags.NONE,
      null
    );
  } catch (e) {
    console.error("Failed to save emoji counts", e);
  }
}
