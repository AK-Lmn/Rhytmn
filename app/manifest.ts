import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rhythm — Your body, in balance",
    short_name: "Rhythm",
    description: "Private bathroom, hydration, and wellness tracking.",
    start_url: "/home",
    display: "standalone",
    background_color: "#f8f5ef",
    theme_color: "#315f56",
    icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" }],
  };
}
