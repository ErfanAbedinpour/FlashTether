"use client";

import { useTronWallet } from "@/hooks/useTronWallet";
import { truncateAddress } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Wallet, Loader2, AlertCircle } from "lucide-react";

interface Props { className?: string; }

export function TronWalletButton({ className }: Props) {
  const { state, address, error, connect, disconnect } = useTronWallet();

  if (state === "not_installed") {
    return (
      <a
        href="https://www.tronlink.org/"
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
          "border border-[var(--border-alt)] text-[var(--accent)] hover:bg-[var(--accent-dim)] transition-colors",
          className
        )}
      >
        <AlertCircle className="w-4 h-4" />
        Install TronLink
      </a>
    );
  }

  if (state === "connected" && address) {
    return (
      <button
        onClick={disconnect}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
          "bg-[var(--accent-dim)] border border-[var(--border-alt)] text-[var(--accent)]",
          "hover:bg-red-900/20 hover:border-red-500/30 hover:text-red-400 transition-colors",
          "mono",
          className
        )}
        title="Click to disconnect"
      >
        <span className="pulse-dot" />
        {truncateAddress(address)}
      </button>
    );
  }

  if (state === "connecting") {
    return (
      <button
        disabled
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
          "bg-[var(--accent-dim)] border border-[var(--border-alt)] text-[var(--text-muted)] cursor-wait",
          className
        )}
      >
        <Loader2 className="w-4 h-4 spin" />
        Connecting…
      </button>
    );
  }

  return (
    <button
      onClick={connect}
      title={error ?? undefined}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
        "bg-[var(--accent)] text-black hover:opacity-90 transition-opacity",
        state === "error" && "bg-red-500 text-white",
        className
      )}
    >
      <Wallet className="w-4 h-4" />
      {state === "error" ? "Retry Connect" : "Connect Wallet"}
    </button>
  );
}
