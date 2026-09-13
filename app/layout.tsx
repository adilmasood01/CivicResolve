import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

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
