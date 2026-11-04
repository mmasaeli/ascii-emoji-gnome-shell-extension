// GNOME Shell 48 added St.BoxLayout's `orientation` property; GNOME Shell 51
// removed the older `vertical` property, so neither works across our whole
// supported range (46-51) on its own.
//
// Kept free of `resource://` imports so it can be loaded directly by plain
// `gjs` (see tests/check-box-layout-api.js) against the real St/Clutter
// typelibs for each supported GNOME Shell version, without needing a running
// shell session.

export function usesOrientationProperty(shellMajorVersion) {
  return shellMajorVersion >= 48;
}

export function newBoxLayout(St, Clutter, shellMajorVersion, vertical, props = {}) {
  if (usesOrientationProperty(shellMajorVersion)) {
    props.orientation = vertical
      ? Clutter.Orientation.VERTICAL
      : Clutter.Orientation.HORIZONTAL;
  } else {
    props.vertical = vertical;
  }
  return new St.BoxLayout(props);
}
