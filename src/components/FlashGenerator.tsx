"use client";

import { cn, isValidTronAddress, usdToTrx, trxToSun, formatAmount } from "@/lib/utils";
import { AmountSelector } from "./AmountSelector";
import { DurationSelector } from "./DurationSelector";
import { useTrxPrice } from "@/hooks/useTrxPrice";
import type { FlashGeneratorState } from "@/hooks/useFlashGenerator";
import { Zap, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface Props { gen: FlashGeneratorState; }

export function FlashGenerator({ gen }: Props) {
  const { usdPerTrx, loading: priceLoading } = useTrxPrice();

  const addressValid  = isValidTronAddress(gen.targetAddress);
  const priceUSD      = gen.selectedTier.priceUSD;
  const priceTRX      = usdPerTrx > 0 ? usdToTrx(priceUSD, usdPerTrx) : 0;
  const canProceed    = addressValid && gen.targetAddress.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y:  0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass rounded-2xl p-6 space-y-6 max-w-lg w-full mx-auto"
    >
      {/* Title row */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-[var(--text)]">Flash Generator</h2>
        <span className="flex items-center gap-1.5 text-xs text-[var(--accent)] mono">
          <span className="pulse-dot" />
          Ready
        </span>
      </div>

      {/* Amount */}
      <AmountSelector
        selected={gen.selectedTier}
        onSelect={gen.selectTier}
        trxPerUsd={usdPerTrx}
      />

      {/* Duration */}
      <DurationSelector
        selected={gen.selectedDuration}
        onSelect={gen.selectDuration}
      />

      {/* Target address */}
      <div>
        <label className="block text-xs text-[var(--text-muted)] uppercase tracking-widest mb-3">
          Target Address
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="T... (42 chars Tron address)"
            value={gen.targetAddress}
            onChange={e => gen.setTargetAddress(e.target.value.trim())}
            className={cn(
              "w-full bg-[var(--bg-card2)] border rounded-xl px-4 py-3 text-sm mono",
              "placeholder:text-[var(--text-muted)] text-[var(--text)]",
              "focus:outline-none transition-colors",
              gen.targetAddress.length > 0
                ? addressValid
                  ? "border-[var(--accent)] focus:border-[var(--accent)]"
                  : "border-[var(--red)] focus:border-[var(--red)]"
                : "border-[var(--border)] focus:border-[var(--border-alt)]"
            )}
          />
          {gen.targetAddress.length > 0 && !addressValid && (
            <div className="flex items-center gap-1 mt-1.5 text-xs text-[var(--red)]">
              <AlertCircle className="w-3 h-3" />
              Invalid Tron address — must start with T, 34 characters
            </div>
          )}
        </div>
      </div>

      {/* Summary row */}
      <div className="glass-alt rounded-xl p-4 space-y-2 text-sm">
        <Row label="Flash Amount" value={`${formatAmount(gen.selectedTier.amount)} TETHER`} />
        <Row label="Network"      value="Tron Nile Testnet" accent />
        <Row label="Target"       value={gen.targetAddress ? (addressValid ? "✓ Valid" : "✗ Invalid") : "—"} />
        <Row label="Duration"     value={gen.selectedDuration.label} />
        <div className="border-t border-[var(--border)] pt-2 mt-2">
          <Row
            label="Total Price"
            value={priceLoading ? "…" : `$${priceUSD} · ~${priceTRX.toFixed(1)} TRX`}
            bold
          />
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={gen.openPayment}
        disabled={!canProceed}
        className={cn(
          "w-full py-4 rounded-xl font-semibold text-base transition-all",
          "flex items-center justify-center gap-2",
          canProceed
            ? "bg-[var(--accent)] text-black hover:opacity-90 glow-accent"
            : "bg-[var(--bg-card2)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--border)]"
        )}
      >
        <Zap className="w-5 h-5" />
        Buy Flash TETHER
      </button>

      {!canProceed && (
        <p className="text-center text-xs text-[var(--text-muted)]">
          Enter a valid Tron address to continue
        </p>
      )}
    </motion.div>
  );
}

function Row({
  label, value, accent, bold,
}: {
  label: string; value: string; accent?: boolean; bold?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[var(--text-muted)] text-xs">{label}</span>
      <span className={cn(
        "text-xs mono",
        accent && "text-[var(--accent)]",
        bold   && "font-bold text-[var(--text)]",
        !accent && !bold && "text-[var(--text-mid)]"
      )}>
        {value}
      </span>
    </div>
  );
}
