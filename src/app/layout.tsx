import type { Metadata } from "next";
import "./globals.css";

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
      <body className="antialiased min-h-screen bg-white">
        <div className="relative z-0 min-h-screen py-10">
          <main className="container-tight">
            {children}
          </main>
          <footer className="mt-20 py-10 text-center">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-notion-text-light opacity-50">
              Crafted with Precision • 2026
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}

