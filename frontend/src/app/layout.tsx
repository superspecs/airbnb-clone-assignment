import type { Metadata } from "next";
import { Suspense } from "react";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { ToastFromUrl, Toaster } from "@/components/ui/Toast";

import "./globals.css";

export const metadata: Metadata = {
  title: "Stays — find a place to stay",
  description: "Short-stay booking marketplace (assignment project)",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
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
