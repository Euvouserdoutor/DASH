import type { ReactNode } from "react";

import "./globals.css";

export const metadata = {
  title: "DASH Crypto Pulse",
  description: "Premium crypto dashboard"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
