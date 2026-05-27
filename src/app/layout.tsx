import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "BER+ Resilience Infrastructure Hub",
  description: "War-room style strategic map + RSS intelligence feed for the BER+ corridor.",
  manifest: "/manifest.webmanifest"
};

export const viewport: Viewport = {
  themeColor: "#06080c"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}

