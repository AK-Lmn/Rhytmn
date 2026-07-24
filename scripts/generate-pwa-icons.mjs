import sharp from "sharp";

const icons = [
  ["public/icons/icon-source.svg", "public/icons/icon-192.png", 192],
  ["public/icons/icon-source.svg", "public/icons/icon-512.png", 512],
  ["public/icons/icon-source.svg", "public/icons/apple-touch-icon.png", 180],
  ["public/icons/icon-maskable-source.svg", "public/icons/icon-maskable-192.png", 192],
  ["public/icons/icon-maskable-source.svg", "public/icons/icon-maskable-512.png", 512],
];

await Promise.all(
  icons.map(([source, output, size]) => sharp(source).resize(size, size).png().toFile(output)),
);
