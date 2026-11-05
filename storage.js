// Emoji list + persistent usage counts.
//
// The bundled emojis.json ships with the extension and is replaced on every
// update, so it is read-only here. User state (usage counts) lives outside
// the extension directory so that it survives updates and reinstalls.
//
// Kept free of `resource://` imports so it stays independently testable under
// plain gjs: see tests/storage.test.js, which injects temporary paths.

import Gio from "gi://Gio";
import GLib from "gi://GLib";

Gio._promisify(Gio.File.prototype, "load_contents_async");
Gio._promisify(
  Gio.File.prototype,
  "replace_contents_bytes_async",
  "replace_contents_finish"
);

const EXTENSION_UUID = "ascii-emoji@masood.masaeli";

async function readJson(path) {
  const file = Gio.File.new_for_path(path);
  const [content] = await file.load_contents_async(null);
  return JSON.parse(new TextDecoder().decode(content));
}

export function createStorage({
  bundledPath = GLib.build_filenamev([
    GLib.path_get_dirname(GLib.filename_from_uri(import.meta.url)[0]),
    "emojis.json",
  ]),
  userDataDir = GLib.build_filenamev([
    GLib.get_user_data_dir(),
    EXTENSION_UUID,
  ]),
} = {}) {
  const countsPath = GLib.build_filenamev([userDataDir, "counts.json"]);

  async function loadCounts() {
    try {
      if (GLib.file_test(countsPath, GLib.FileTest.EXISTS))
        return (await readJson(countsPath)) ?? {};
    } catch (e) {
      console.error("Failed to load emoji counts", e);
    }
    return {};
  }

  // Bundled list merged with saved counts, most-used first.
  async function loadEmojiData() {
    let data = [];
    try {
      data = (await readJson(bundledPath)) ?? [];
    } catch (e) {
      console.error("Failed to load emoji data", e);
    }
    const counts = await loadCounts();
    data.forEach((emoji) => {
      emoji.count = counts[emoji.name] ?? 0;
    });
    data.sort((a, b) => b.count - a.count);
    return data;
  }

  async function saveEmojiData(data) {
    try {
      GLib.mkdir_with_parents(userDataDir, 0o755);
      const counts = {};
      data.forEach((emoji) => {
        if (emoji.count > 0) counts[emoji.name] = emoji.count;
      });
      const bytes = new GLib.Bytes(
        new TextEncoder().encode(JSON.stringify(counts))
      );
      await Gio.File.new_for_path(countsPath).replace_contents_bytes_async(
        bytes,
        null,
        false,
        Gio.FileCreateFlags.NONE,
        null
      );
    } catch (e) {
      console.error("Failed to save emoji counts", e);
    }
  }

  return { loadEmojiData, saveEmojiData, countsPath };
}
