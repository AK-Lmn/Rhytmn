import type { Metadata } from "next";
import { headers } from "next/headers";
import { DM_Sans, Manrope } from "next/font/google";
import { AppProviders } from "./components/providers";
import "./globals.css";

const dmSans = DM_Sans({ variable: "--font-body", subsets: ["latin"] });
const manrope = Manrope({ variable: "--font-display", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
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
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg", apple: "/favicon.svg" },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${manrope.variable}`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
