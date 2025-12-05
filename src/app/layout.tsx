import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { nunito } from "@/fonts/nunito";
import "./globals.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import DesktopRestriction from "@/components/DesktopRestriction";
import HelpCenter from "./(protected)/help-center/page";
import { ScrollVisibilityProvider } from "@/hooks/useScrollVisibilityContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s - CUNO COVO",
    default: "CUNO COVO",
  },
  description:
    "CUNO COVO is a platform for wedding photographers, videographers, florists, and planners to share perspectives anonymously-soon helping couples discover aligned wedding talent.",

  // Open Graph (Facebook, LinkedIn, Discord, etc.)
  openGraph: {
    title: "CUNO COVO",
    description:
      "CUNO COVO is a platform for wedding photographers, videographers, florists, and planners to share perspectives anonymously-soon helping couples discover aligned wedding talent.",
    siteName: "CUNO COVO",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://cunocovo.com/android-chrome-512x512.png",
        width: 512,
        height: 512,
        alt: "CUNO COVO",
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "CUNO COVO",
    description:
      "CUNO COVO is a platform for wedding photographers, videographers, florists, and planners to share perspectives anonymously-soon helping couples discover aligned wedding talent.",
    images: [
      {
        url: "https://cunocovo.com/android-chrome-512x512.png",
        width: 512,
        height: 512,
        alt: "CUNO COVO",
      },
    ]
  },

  // Icons - proper format for Google search results
  icons: {
    icon: [
      { url: "/faviIcons/favicon.ico", sizes: "any" },
      { url: "/faviIcons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/faviIcons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/faviIcons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: [
      { url: "/faviIcons/favicon.ico" },
    ],
  },

  // Additional meta tags
  keywords: [
    "wedding photographers",
    "wedding videographers",
    "wedding florists",
    "wedding planners",
    "CUNO COVO",
    "wedding vendors",
  ],
  authors: [{ name: "CUNO COVO" }],
  creator: "CUNO COVO",
  publisher: "CUNO COVO",

  // App manifest for PWA
  manifest: "/manifest.json",

  // Robots and indexing
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Additional meta tags
  category: "Wedding Services",
  applicationName: "CUNO COVO",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#000000" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-TileImage" content="/sms-icon.jpg" />

        <meta property="og:image" content="https://cunocovo.com/android-chrome-512x512.png" />
        <meta property="og:image:width" content="512" />
        <meta property="og:image:height" content="512" />
        <meta property="og:title" content="CUNO COVO" />
        <meta property="og:description" content="CUNO COVO is a platform..." />


        {/* Preload critical fonts */}
        <link
          rel="preload"
          href="/fonts/nunito-variable.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* Favicon */}
        {/* <link rel="icon" href="/sms-icon.jpg" type="image/jpeg" /> */}
        <link rel="icon" href="/faviIcons/favicon-16x16.png" sizes="16x16" type="image/png" />
        <link rel="icon" href="/faviIcons/favicon-32x32.png" sizes="32x32" type="image/png" />
        <link rel="icon" href="/faviIcons/favicon.ico" sizes="any" type="image/x-icon" />

      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${nunito.variable} antialiased`}
      >
        <GoogleOAuthProvider
          clientId={`${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}`}
        >
          <DesktopRestriction>
            <ScrollVisibilityProvider>
              {children}
            </ScrollVisibilityProvider>

            <div id="modal-root"></div>
            <HelpCenter />
          </DesktopRestriction>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}