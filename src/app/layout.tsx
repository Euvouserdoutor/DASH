import type { ReactNode } from "react";

import "./globals.css";
import { DashCloudGate } from "@/components/shell/DashCloudGate";

export const metadata = {
  title: "DASH Crypto Pulse",
  description: "Premium crypto dashboard"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body><DashCloudGate>{children}</DashCloudGate></body>
    </html>
  );
}
