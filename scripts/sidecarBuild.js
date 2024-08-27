const fs = require("fs/promises");

const path = require("path");
const execa = require("execa");

let extension = "";
if (process.platform === "win32") {
  extension = ".exe";
}
const desktopPath = path.join(__dirname, "../apps/desktop");
const tauriPath = path.join(desktopPath, "src-tauri");
async function main() {
  const rustInfo = (await execa("rustc", ["-vV"])).stdout;
  const targetTriple = /host: (\S+)/g.exec(rustInfo)[1];

  if (!targetTriple) {
    console.error("Failed to determine platform target triple");
  }

  console.log("Building sidecar for", targetTriple);
  await execa(
    "cargo",
    [
      "install",
      "rqbit",
      "--root",
      `${tauriPath}/binaries`,
      "--features=webui",
      "--target",
      targetTriple,
    ],
    {
      stderr: "inherit",
      stdout: "inherit",
    },
  );
  await fs.copyFile(
    `${tauriPath}/binaries/bin/rqbit${extension}`,
    `${tauriPath}/binaries/rqbit-${targetTriple}${extension}`,
  );
  await fs.rename(
    `${tauriPath}/binaries/bin/rqbit${extension}`,
    `${tauriPath}/binaries/rqbit${extension}`,
  );
}

main().catch((e) => {
  throw e;
});
