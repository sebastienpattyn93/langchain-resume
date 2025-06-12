import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Zen_Dots } from "next/font/google";
import "./globals.css";
import "./resume-chat.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const zenDots = Zen_Dots({
  weight: ['400'],
  variable: "--font-zen-dots",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sebastien Pattyn",
  description: "Interactive resumé chat application for Sebastien Pattyn",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${zenDots.variable}`}>
      <body
        className={`antialiased`}
        style={{ backgroundColor: '#0a0a14' }}
      >
        {children}
      </body>
    </html>
  );
}
