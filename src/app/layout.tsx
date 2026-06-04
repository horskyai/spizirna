import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Spižírna",
  description: "Produktová databáze — EAN sken, spižírna, kalorie, recepty",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Spižírna" },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#F2EDE4",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body>
        <Providers>
          <div style={{ height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
