/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { Metadata } from "next";
import { Inter } from "next/font/google";
// @ts-ignore
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Verba - AI Second Brain",
  description: "Your personalized AI tutor powered by advanced language models",
  icons: {
    icon: '/xi.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}