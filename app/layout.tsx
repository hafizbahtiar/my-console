import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth-context";
import { LanguageProvider } from "@/lib/language-context";
import { ErrorBoundary } from "@/components/error-boundary";
import { setupGlobalErrorHandlers } from "@/lib/error-handler";
import { applySecurityHeaders } from "@/middlewares/security-headers";
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
  title: "My Console - Login",
  description: "Secure login portal for My Console application",
  keywords: ["login", "authentication", "console", "dashboard"],
  authors: [{ name: "My Console Team" }],
  creator: "My Console",
  publisher: "My Console",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "My Console - Login",
    description: "Secure login portal for My Console application",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Setup global error handlers on client side
  if (typeof window !== 'undefined') {
    setupGlobalErrorHandlers()
  }

  return (
    <html lang="en" suppressHydrationWarning>
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
