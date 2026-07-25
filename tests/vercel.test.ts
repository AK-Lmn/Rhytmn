import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("Vercel build configuration", () => {
  it("uses Vercel's native Next.js builder without replacing the Vinext build", async () => {
    const [packageSource, vercelSource] = await Promise.all([
      readFile("package.json", "utf8"),
      readFile("vercel.json", "utf8"),
    ]);
    const packageJson = JSON.parse(packageSource) as {
      scripts: Record<string, string>;
    };
    const vercelConfig = JSON.parse(vercelSource) as {
      framework: string;
      buildCommand: string | null;
      outputDirectory: string | null;
    };

    expect(packageJson.scripts.build).toContain("vinext build");
    expect(packageJson.scripts["vercel-build"]).toBe(
      "node scripts/vercel-next-build.mjs",
    );
    expect(vercelConfig).toMatchObject({
      framework: "nextjs",
      buildCommand: null,
      outputDirectory: null,
    });
  });

  it("keeps deployment artifacts and environment files out of Git", async () => {
    const gitignore = await readFile(".gitignore", "utf8");
    expect(gitignore).toMatch(/^\.env\*$/m);
    expect(gitignore).toMatch(/^\.vercel$/m);
  });
});
