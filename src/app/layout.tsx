import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });


export const metadata: Metadata = {
  title: "Chronolog | Minimalist Time Tracking",
  description: "Track your time with elegance and simplicity.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased min-h-screen`}>
        {/* Ambient background orbs for liquid glass depth */}
        <div className="bg-orb-container" aria-hidden="true">
          <div className="bg-orb bg-orb-1" />
          <div className="bg-orb bg-orb-2" />
          <div className="bg-orb bg-orb-3" />
        </div>
        <div className="relative z-0 min-h-screen py-10">
          {children}
          <footer className="mt-20 py-10 text-center">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-notion-text-light opacity-40">
              Crafted with Precision • 2026
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}

