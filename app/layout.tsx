import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0f172a",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CivicResolve",
    template: "%s | CivicResolve",
  },
  description:
    "CivicResolve — A Government/Public-Service Complaint Management System. Submit, track, and resolve complaints about public services.",
  keywords: ["government", "complaints", "public service", "civic"],
  authors: [{ name: "CivicResolve" }],
  robots: { index: false, follow: false }, // not indexable (demo app)
  icons: {
    icon: [
      { url: "/CivicResolve.jpg", type: "image/jpeg" },
    ],
    shortcut: "/CivicResolve.jpg",
    apple: "/CivicResolve.jpg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
