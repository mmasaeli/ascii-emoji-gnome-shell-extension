// Runtime test for storage.js, run under plain gjs (no GNOME Shell needed):
//
//   gjs -m tests/storage.test.js
//
// Uses temporary directories, never the real ~/.local/share, and exercises
// the real Gio async IO paths - the kind of breakage static analysis (lint,
// Shexli) cannot see, e.g. a missing *_finish mapping in Gio._promisify.

import Gio from "gi://Gio";
import GLib from "gi://GLib";

import { createStorage } from "../storage.js";

const testsDir = GLib.path_get_dirname(GLib.filename_from_uri(import.meta.url)[0]);
const REAL_BUNDLE = GLib.build_filenamev([testsDir, "..", "emojis.json"]);

let failures = 0;
function check(name, condition, detail = "") {
  console.log(`${condition ? "ok  " : "FAIL"} - ${name}${condition ? "" : ` ${detail}`}`);
  if (!condition) failures++;
}

function tempDir() {
  return GLib.dir_make_tmp("ascii-emoji-test-XXXXXX");
}

function write(path, text) {
  GLib.file_set_contents(path, text);
}

function read(path) {
  return new TextDecoder().decode(GLib.file_get_contents(path)[1]);
}

function rmrf(path) {
  const file = Gio.File.new_for_path(path);
  if (!file.query_exists(null)) return;
  if (file.query_file_type(Gio.FileQueryInfoFlags.NONE, null) === Gio.FileType.DIRECTORY) {
    const children = file.enumerate_children("standard::name", Gio.FileQueryInfoFlags.NONE, null);
    let info;
    while ((info = children.next_file(null)) !== null)
      rmrf(GLib.build_filenamev([path, info.get_name()]));
  }
  file.delete(null);
}

async function main() {
  const root = tempDir();
  const bundle = GLib.build_filenamev([root, "emojis.json"]);
  const userDir = GLib.build_filenamev([root, "user", "nested"]); // must be created
  const countsFile = GLib.build_filenamev([userDir, "counts.json"]);
  const names = (data) => data.map((e) => e.name).join(",");

  const emojis = [
    { name: "a", keyword: "a", emoji: "A" },
    { name: "b", keyword: "b", emoji: "B" },
    { name: "c", keyword: "c", emoji: "C" },
  ];
  write(bundle, JSON.stringify(emojis));
  const storage = createStorage({ bundledPath: bundle, userDataDir: userDir });

  // 1. First run: no counts file yet.
  let data = await storage.loadEmojiData();
  check("first run loads the bundled list", names(data) === "a,b,c", names(data));
  check("first run counts are all 0", data.every((e) => e.count === 0));

  // 2. Save creates the (nested) directory and only stores counts > 0.
  data.find((e) => e.name === "c").count = 3;
  data.find((e) => e.name === "b").count = 1;
  await storage.saveEmojiData(data);
  check("save creates counts.json in a new directory", GLib.file_test(countsFile, GLib.FileTest.EXISTS));
  const saved = JSON.parse(read(countsFile));
  check("only used emojis are stored", JSON.stringify(saved) === '{"b":1,"c":3}', JSON.stringify(saved));

  // 3. Reload restores counts and sorts most-used first.
  data = await storage.loadEmojiData();
  check("reload sorts by count", names(data) === "c,b,a", names(data));

  // 4. THE REGRESSION: an "update" replaces the bundled file; counts survive.
  write(bundle, JSON.stringify(emojis)); // fresh bundle, as after an update
  data = await storage.loadEmojiData();
  check("counts survive the bundled file being replaced", names(data) === "c,b,a", names(data));

  // 5. An update that adds an emoji: it appears with count 0.
  write(bundle, JSON.stringify([...emojis, { name: "d", keyword: "d", emoji: "D" }]));
  data = await storage.loadEmojiData();
  check("emojis added by an update show up", names(data) === "c,b,a,d", names(data));
  check("new emoji starts at 0", data.find((e) => e.name === "d").count === 0);

  // 6. An update that removes an emoji: its stale count is ignored, not shown.
  write(bundle, JSON.stringify(emojis.filter((e) => e.name !== "c")));
  data = await storage.loadEmojiData();
  check("removed emojis are not shown", names(data) === "b,a", names(data));

  // 7. Corrupt counts file: falls back to zeros instead of breaking.
  write(bundle, JSON.stringify(emojis));
  write(countsFile, "{ not json");
  data = await storage.loadEmojiData();
  check("corrupt counts.json does not break loading", names(data) === "a,b,c" && data.every((e) => e.count === 0), names(data));

  // 8. Saving over a corrupt file repairs it.
  data[0].count = 2;
  await storage.saveEmojiData(data);
  check("save repairs a corrupt counts.json", JSON.parse(read(countsFile)).a === 2);

  // 9. Missing bundled file: empty list, no throw.
  const broken = createStorage({ bundledPath: GLib.build_filenamev([root, "missing.json"]), userDataDir: userDir });
  data = await broken.loadEmojiData();
  check("missing bundled file yields an empty list", Array.isArray(data) && data.length === 0);

  // 10. The real shipped list is valid and has unique names (counts are keyed by name).
  const real = await createStorage({ bundledPath: REAL_BUNDLE, userDataDir: userDir }).loadEmojiData();
  const unique = new Set(real.map((e) => e.name));
  check("shipped emojis.json loads", real.length > 0, String(real.length));
  check("shipped emoji names are unique", unique.size === real.length, `${unique.size} unique of ${real.length}`);
  check("shipped emojis have name, keyword and emoji", real.every((e) => e.name && e.keyword && e.emoji));

  rmrf(root);
}

const loop = new GLib.MainLoop(null, false);
main()
  .catch((e) => {
    console.error("Test crashed", e);
    failures++;
  })
  .finally(() => {
    console.log(failures === 0 ? "\nAll storage tests passed" : `\n${failures} storage test(s) FAILED`);
    loop.quit();
  });
loop.run();
imports.system.exit(failures === 0 ? 0 : 1);
