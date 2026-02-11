import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

export const metadata: Metadata = {
  title: "Intel Hub",
  description: "Unified intelligence platform - World Monitor and Delta Intelligence in one dashboard.",
  keywords: ["Intel Hub", "OSINT", "Delta Intelligence", "World Monitor", "geopolitical risk", "market signals", "risk dashboard", "real-time intelligence"],
  authors: [{ name: "Intel Hub" }],
  openGraph: {
    title: "Intel Hub",
    description: "Unified real-time intelligence and OSINT risk signals dashboard",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Intel Hub",
    description: "Intel Hub - Unified Real-time Intelligence Platform",
  },
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${jetbrainsMono.variable} antialiased scanlines`}>
        {children}
      </body>
    </html>
  );
}
