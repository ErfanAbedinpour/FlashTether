import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title:       "FlashTether Lab | Time-Gated TRC20 Demo",
  description: "University training project: a Next.js + Solidity demo of a time-limited, non-transferable TRC20-style token on the Tron Nile testnet.",
  keywords:    ["tron", "nile", "testnet", "trc20", "solidity", "nextjs", "university"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
