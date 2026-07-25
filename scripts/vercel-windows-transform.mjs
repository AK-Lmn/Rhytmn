import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const adapterSuffix = "/@vercel/next/dist/adapter/index.js";
const symlinkCall = [
  "            prerenderFunctionDir",
  "          ).catch((err) => {",
].join("\n");
const junctionCall = [
  "            prerenderFunctionDir,",
  '            "junction"',
  "          ).catch((err) => {",
].join("\n");

export async function load(url, context, nextLoad) {
  const result = await nextLoad(url, context);
  if (
    process.platform !== "win32" ||
    !url.startsWith("file:") ||
    !fileURLToPath(url).replaceAll("\\", "/").endsWith(adapterSuffix)
  ) {
    return result;
  }

  const source =
    result.source == null
      ? await readFile(fileURLToPath(url), "utf8")
      : result.source.toString();
  if (!source.includes(symlinkCall)) {
    throw new Error("Unsupported @vercel/next adapter: function-link call was not found");
  }
  if (process.env.RHYTHM_DEBUG_VERCEL_LINKS === "1") {
    console.error(`[rhythm-vercel-links] transformed ${fileURLToPath(url)}`);
  }

  return {
    ...result,
    source: source.replace(symlinkCall, junctionCall),
  };
}
