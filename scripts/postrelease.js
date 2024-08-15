// Bumps desktop version

const fs = require("fs");
const path = require("path");

let version = process.argv[2];
if (!version) {
  const pkg = require("../apps/desktop/package.json");

  version = pkg.version;
}

const desktopPath = path.join(__dirname, "../apps/desktop");
const desktopTauriPath = path.join(desktopPath, "src-tauri");

// Bump tauri.conf.json
const tauriConf = JSON.parse(
  fs.readFileSync(path.join(desktopTauriPath, "tauri.conf.json")),
);
tauriConf.version = version;
fs.writeFileSync(
  path.join(desktopTauriPath, "tauri.conf.json"),
  JSON.stringify(tauriConf, null, 2),
);

// Bump Cargo.toml
const cargoToml = fs
  .readFileSync(path.join(desktopTauriPath, "Cargo.toml"))
  .toString();
fs.writeFileSync(
  path.join(desktopTauriPath, "Cargo.toml"),
  cargoToml.replace(
    /(\[package\][\s\S]*?)\n\s*version\s*=\s*"[^"]*"/,
    `$1\nversion = "${version}"`,
  ),
);
