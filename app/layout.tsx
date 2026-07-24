import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { AppProviders } from "./components/providers";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f4ee" },
    { media: "(prefers-color-scheme: dark)", color: "#15201d" },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const hostname = host.replace(/^\[|\]$/g, "").split(":")[0];
  const localHost = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (localHost ? "http" : "https");
  return {
    metadataBase: new URL(`${protocol}://${host}`),
    title: { default: "Rhythm — Your body, in balance", template: "%s · Rhythm" },
    description: "A private, friendly way to track bathroom habits, hydration, and daily wellness patterns.",
    applicationName: "Rhythm",
    manifest: "/manifest.webmanifest",
    appleWebApp: { capable: true, title: "Rhythm", statusBarStyle: "default" },
    openGraph: {
      title: "Rhythm — Your body, in balance",
      description: "Private wellness tracking, made human.",
      type: "website",
      images: [{ url: "/og.png", width: 1672, height: 941, alt: "Rhythm private wellness tracking" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Rhythm — Your body, in balance",
      description: "Private wellness tracking, made human.",
      images: ["/og.png"],
    },
    icons: {
      icon: [
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
      ],
      shortcut: "/favicon.svg",
      apple: [{ url: "/icons/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
    },
    formatDetection: { telephone: false },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
