import type { Metadata } from "next";
import { Suspense } from "react";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { ToastFromUrl, Toaster } from "@/components/ui/Toast";
import { THEME_SCRIPT } from "@/lib/theme";

import "./globals.css";

export const metadata: Metadata = {
  title: "Stays — find a place to stay",
  description: "Short-stay booking marketplace (assignment project)",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The theme script sets data-theme on <html> before React hydrates, hence the warning opt-out.
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Static, render-blocking: applies the saved theme before first paint (no flash). */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        {/* First Tab stop on every page: jump past the header to the page content. */}
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        {children}
        <SiteFooter />
        <Toaster />
        <Suspense fallback={null}>
          <ToastFromUrl />
        </Suspense>
      </body>
    </html>
  );
}
