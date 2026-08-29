import type { Metadata } from "next";
import { Literata, Tektur } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const display = Tektur({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "700"],
});

const body = Literata({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Batti — Dhaka crowd board",
  description:
    "Crowd Reports for power On or Off in twelve Dhaka Areas. Sample pattern, not live DESCO.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
