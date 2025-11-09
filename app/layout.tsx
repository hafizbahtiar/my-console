import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth-context";
import { LanguageProvider } from "@/lib/language-context";
import { ErrorBoundary } from "@/components/error-boundary";
import { PrimaryColorInit } from "@/components/app/primary-color-init";
import { ErrorHandlerInit } from "@/components/app/error-handler-init";
import { SessionManagerInit } from "@/components/app/session-manager-init";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://console.hafizbahtiar.com'),
  title: {
    default: "My Console - Admin Dashboard",
    template: "%s | My Console",
  },
  description: "Comprehensive admin dashboard with authentication, audit logging, blog management, community features, and analytics. Built with Next.js, Appwrite, and modern web technologies.",
  keywords: [
    "admin dashboard",
    "console",
    "dashboard",
    "authentication",
    "audit logging",
    "blog management",
    "CMS",
    "community management",
    "analytics",
    "Next.js",
    "Appwrite",
    "admin panel",
    "content management",
    "user management",
    "security",
    "monitoring",
  ],
  authors: [{ name: "Hafiz Bahtiar", url: "https://hafizbahtiar.com" }],
  creator: "Hafiz Bahtiar",
  publisher: "Hafiz Bahtiar",
  category: "Technology",
  classification: "Technology",
  applicationName: "My Console",
  appleWebApp: {
    title: "My Console",
    statusBarStyle: "black-translucent",
    capable: true,
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "My Console",
    title: "My Console - Admin Dashboard",
    description: "Comprehensive admin dashboard with authentication, audit logging, blog management, community features, and analytics.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "My Console Admin Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "My Console - Admin Dashboard",
    description: "Comprehensive admin dashboard with authentication, audit logging, blog management, and analytics.",
    images: ["/og-image.png"],
    creator: "@hafizbahtiar",
  },
  alternates: {
    canonical: "/",
  },
  verification: {
    // Add your verification codes here when available
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
    // yahoo: "your-yahoo-verification-code",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#171717" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Favicons - comprehensive set */}
        <link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicons/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicons/favicon-96x96.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-icon.png" />
        <link rel="mask-icon" href="/favicons/safari-pinned-tab.svg" color="#171717" />
        <link rel="manifest" href="/manifest.json" />
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "My Console",
              applicationCategory: "AdminDashboard",
              operatingSystem: "Web",
              description: "Comprehensive admin dashboard with authentication, audit logging, blog management, community features, and analytics.",
              author: {
                "@type": "Person",
                name: "Hafiz Bahtiar",
                url: "https://hafizbahtiar.com",
              },
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background font-sans`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
            <LanguageProvider>
              <AuthProvider>
                <ErrorBoundary>
                  <ErrorHandlerInit />
                  <PrimaryColorInit />
                  <SessionManagerInit />
                  {children}
                </ErrorBoundary>
                <Toaster />
              </AuthProvider>
            </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
