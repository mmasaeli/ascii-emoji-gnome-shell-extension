import St from "gi://St";
import GObject from "gi://GObject";
import Gio from "gi://Gio";
import GLib from "gi://GLib";

import {
  Extension,
  gettext as _,
} from "resource:///org/gnome/shell/extensions/extension.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";

const Indicator = GObject.registerClass(
  class Indicator extends PanelMenu.Button {
    _init() {
      super._init(0.0, _("ASCII Emoji"));

      this.add_child(
        new St.Label({
          text: "(◉‿◉)",
          style_class: "system-status-icon",
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

      this.clipboard = St.Clipboard.get_default();

      this._menuItems = [];
      this._emojiData = loadEmojiData();
      this._refreshItems();
    }

    _refreshItems() {
      this._menuItems.forEach((item) => item.destroy());
      this._menuItems.length = 0;

      const query = this.searchEntry.get_text().toLowerCase();

      const matchedEmojis = this._emojiData
        .filter((emoji) => emoji.keyword.toLowerCase().includes(query))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      matchedEmojis.forEach((emoji) => {
        let item = new PopupMenu.PopupMenuItem(`${emoji.name}: ${emoji.emoji}`);
        item.connect("activate", () => {
          this.clipboard.set_text(St.ClipboardType.CLIPBOARD, emoji.emoji);
          emoji.count += 1;
          saveEmojiData(this._emojiData);
          this._refreshItems();
        });
        this.menu.addMenuItem(item);
        this._menuItems.push(item);
      });
    }
  }
);

export default class IndicatorExampleExtension extends Extension {
  enable() {
    this._indicator = new Indicator();
    Main.panel.addToStatusArea(this.uuid, this._indicator);
  }

  disable() {
    this._indicator.destroy();
    this._indicator = null;
  }
}

// File path for persistent storage
const DATA_FILE_PATH = GLib.build_filenamev([
  GLib.get_user_data_dir(),
  "gnome-shell",
  "extensions",
  "ascii-emoji@masood.masaeli",
  "emojis.json",
]);

function loadEmojiData() {
  try {
    let file = Gio.File.new_for_path(DATA_FILE_PATH);
    let [ok, content] = file.load_contents(null);
    if (ok) {
      return JSON.parse(content);
    }
  } catch (e) {
    logError(e, "Failed to load emoji data");
  }
}

function saveEmojiData(data) {
  try {
    let file = Gio.File.new_for_path(DATA_FILE_PATH);
    file.replace_contents(
      JSON.stringify(data),
      null,
      false,
      Gio.FileCreateFlags.NONE,
      null
    );
  } catch (e) {
    logError(e, "Failed to save emoji data");
  }
}
