"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ExternalLink, RefreshCw, Clock, Loader2, XCircle } from "lucide-react";
import { cn, formatCountdown, truncateAddress } from "@/lib/utils";
import type { FlashGeneratorState } from "@/hooks/useFlashGenerator";

interface Props { gen: FlashGeneratorState; }

export function FlashStatus({ gen }: Props) {
  const [secondsLeft, setSecondsLeft] = useState<number>(0);

  useEffect(() => {
    if (gen.stage !== "success" || !gen.mintResult) return;
    const msLeft = gen.mintResult.expiresAt - Date.now();
    setSecondsLeft(Math.max(0, Math.floor(msLeft / 1000)));

    const interval = setInterval(() => {
      setSecondsLeft(s => Math.max(0, s - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [gen.stage, gen.mintResult]);

  // ── Loading states ────────────────────────────────────────────────────
  if (gen.stage === "verifying" || gen.stage === "minting") {
    const label = gen.stage === "verifying" ? "Verifying payment…" : "Minting flash tokens…";
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-2xl p-10 max-w-lg w-full mx-auto text-center space-y-4"
      >
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full border-2 border-[var(--accent)] border-t-transparent spin" />
        </div>
        <p className="text-[var(--text-mid)] text-sm">{label}</p>
        <p className="text-xs text-[var(--text-muted)]">This may take up to 30 seconds…</p>
      </motion.div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────
  if (gen.stage === "error") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y:  0 }}
        className="glass rounded-2xl p-8 max-w-lg w-full mx-auto text-center space-y-4"
      >
        <XCircle className="w-12 h-12 text-[var(--red)] mx-auto" />
        <h3 className="font-semibold text-[var(--text)]">Something went wrong</h3>
        <p className="text-sm text-[var(--text-muted)]">
          {gen.errorMessage ?? "Unknown error. Please try again."}
        </p>
        <button
          onClick={gen.reset}
          className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl bg-[var(--bg-card2)] border border-[var(--border)] text-sm text-[var(--text-mid)] hover:border-[var(--border-alt)] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </motion.div>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────
  if (gen.stage !== "success" || !gen.mintResult) return null;

  const { mintResult, selectedTier, selectedDuration, targetAddress } = gen;
  const expired = secondsLeft <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 24 }}
      animate={{ opacity: 1, scale: 1,    y:  0 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="glass rounded-2xl p-8 max-w-lg w-full mx-auto space-y-6"
    >
      {/* Icon */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.1 }}
          className="inline-flex w-16 h-16 rounded-full bg-[var(--accent-dim)] border border-[var(--border-alt)] items-center justify-center mb-3"
        >
          <CheckCircle2 className="w-8 h-8 text-[var(--accent)]" />
        </motion.div>
        <h3 className="text-xl font-bold text-[var(--text)]">Flash Generated!</h3>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          {selectedTier.amount.toLocaleString()} TETHER sent to your wallet
        </p>
      </div>

      {/* Countdown */}
      <div className={cn(
        "rounded-xl p-4 text-center border",
        expired
          ? "bg-red-900/20 border-red-700/30"
          : "bg-[var(--accent-dim)] border-[var(--border-alt)]"
      )}>
        <div className="flex items-center justify-center gap-2 mb-1">
          <Clock className={cn("w-4 h-4", expired ? "text-[var(--red)]" : "text-[var(--accent)]")} />
          <span className="text-xs text-[var(--text-muted)] uppercase tracking-widest">
            {expired ? "Flash Expired" : "Time Remaining"}
          </span>
        </div>
        <div className={cn(
          "text-3xl font-bold mono",
          expired ? "text-[var(--red)]" : "text-[var(--accent)]"
        )}>
          {expired ? "00:00:00" : formatCountdown(secondsLeft)}
        </div>
        <div className="text-xs text-[var(--text-muted)] mt-1">
          Duration: {selectedDuration.label}
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 text-sm">
        <Detail label="Target Wallet" value={truncateAddress(targetAddress, 8, 6)} mono />
        <Detail label="Contract"      value={truncateAddress(mintResult.contractAddress, 8, 6)} mono />
        <Detail label="Network"       value="Tron Nile Testnet" accent />
      </div>

      {/* Links */}
      <div className="flex gap-2">
        <a
          href={mintResult.tronscanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[var(--border-alt)] text-[var(--accent)] text-xs font-medium hover:bg-[var(--accent-dim)] transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View on Tronscan
        </a>
        <button
          onClick={gen.reset}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-muted)] text-xs font-medium hover:border-[var(--border-alt)] hover:text-[var(--text-mid)] transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          New Flash
        </button>
      </div>
    </motion.div>
  );
}

function Detail({ label, value, mono, accent }: {
  label: string; value: string; mono?: boolean; accent?: boolean;
}) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-[var(--border)] last:border-0">
      <span className="text-xs text-[var(--text-muted)]">{label}</span>
      <span className={cn(
        "text-xs",
        mono   && "mono",
        accent && "text-[var(--accent)]",
        !accent && "text-[var(--text-mid)]"
      )}>
        {value}
      </span>
    </div>
  );
}
