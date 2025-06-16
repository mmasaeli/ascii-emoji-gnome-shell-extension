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

      this._scrollView = new St.ScrollView({
        style_class: "vfade",
        overlay_scrollbars: true,
        x_expand: true,
      });
      this.menu.box.add_child(this._scrollView);

      this._listBox = new St.BoxLayout({ vertical: true });
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
        let drawing = new St.BoxLayout({
          vertical: false,
          x_expand: true,
        });

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
