const { spawn } = require("node:child_process");

function runUni(args) {
  const isWindows = process.platform === "win32";
  const command = isWindows ? "cmd.exe" : "npx";
  const commandArgs = isWindows ? ["/c", "npx", "uni", ...args] : ["uni", ...args];
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      stdio: "inherit",
      shell: false,
      env: process.env,
    });

    child.on("error", (err) => reject(err));
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`uni command failed with exit code ${code}`));
    });
  });
}

module.exports = (api) => {
  api.registerCommand("uni-serve", async (args = {}) => {
    const platform = args.platform || args.p || process.env.UNI_PLATFORM || "h5";
    const effectivePlatform = platform === "app-plus" ? "h5" : platform;
    await runUni(["-p", effectivePlatform]);
  });

  api.registerCommand("uni-build", async (args = {}) => {
    const platform = args.platform || args.p || process.env.UNI_PLATFORM || "h5";
    await runUni(["build", "-p", platform]);
  });
};
