import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title:       "Flash TETHER | Instant Generation Protocol",
  description: "Generate temporary TETHER tokens that appear as real balance in any TVM wallet. Tron Nile Testnet.",
  keywords:    ["tron", "testnet", "trc20", "flash token", "nile", "TETHER"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
