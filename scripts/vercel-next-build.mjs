import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const moduleResolver = createRequire(import.meta.url);
const nextPackage = moduleResolver.resolve("next/package.json", {
  paths: [projectRoot],
});
const nextCli = path.join(path.dirname(nextPackage), "dist", "bin", "next");
const env = { ...process.env };
const nodeArgs = [nextCli, "build"];

const child = spawn(process.execPath, nodeArgs, {
  cwd: projectRoot,
  env,
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`Next.js build terminated by ${signal}`);
    process.exitCode = 1;
    return;
  }
  process.exitCode = code ?? 1;
});
