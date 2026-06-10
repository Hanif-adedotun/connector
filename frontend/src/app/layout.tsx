import type { Metadata, Viewport } from "next";
import Image from "next/image";
import { Providers } from "./providers";
import { bootFallbackScript } from "@/lib/boot";
import { themeInitScript } from "@/lib/theme";
import { APP_DESCRIPTION, APP_DOMAIN, APP_NAME } from "@/lib/brand";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.webmanifest",
  metadataBase: new URL(`https://${APP_DOMAIN}`),
  openGraph: {
    type: "website",
    url: `https://${APP_DOMAIN}`,
    siteName: APP_NAME,
    title: APP_NAME,
    description: APP_DESCRIPTION,
    locale: "en_US",
    images: [
      {
        url: "/banner.jpg",
        width: 1616,
        height: 1050,
        alt: "Brief — Turn the noise of work into one calm briefing",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: ["/banner.jpg"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  icons: {
    icon: [
      { url: "/icons/icon-512.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-512.png", sizes: "192x192", type: "image/png" }],
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: bootFallbackScript }} />
      </head>
      <body>
        <div
          id="brief-boot"
          className="brief-boot"
          aria-live="polite"
          aria-label="Loading Brief"
        >
          <div className="brief-boot-inner">
            <Image
              src="/icons/icon-512.png"
              alt=""
              width={48}
              height={48}
              priority
              className="brief-boot-icon"
            />
            <div className="brief-boot-spinner" aria-hidden />
          </div>
        </div>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
