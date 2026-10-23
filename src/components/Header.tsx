"use client";

import { TronWalletButton } from "./TronWalletButton";
import { Shield, Zap } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
            <Zap className="w-4 h-4 text-black" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            Flash<span className="text-[var(--accent)]">TETHER</span>
          </span>
          {/* Verified badge */}
          <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--accent-dim)] border border-[var(--border-alt)] text-[var(--accent)]">
            <Shield className="w-3 h-3" />
            Verified Protocol
          </span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-xs text-[var(--text-muted)] mono">
            Nile Testnet
          </span>
          <TronWalletButton />
        </div>
      </div>
    </header>
  );
}
