import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Stays — find a place to stay",
  description: "Short-stay booking marketplace (assignment project)",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
