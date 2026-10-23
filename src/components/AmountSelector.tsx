"use client";

import { cn } from "@/lib/utils";
import { AMOUNT_TIERS, type AmountTier } from "@/lib/constants";
import { usdToTrx } from "@/lib/utils";
import { formatAmount } from "@/lib/utils";

interface Props {
  selected:   AmountTier;
  onSelect:   (tier: AmountTier) => void;
  trxPerUsd:  number;
}

export function AmountSelector({ selected, onSelect, trxPerUsd }: Props) {
  return (
    <div>
      <label className="block text-xs text-[var(--text-muted)] uppercase tracking-widest mb-3">
        Select Amount
      </label>
      <div className="grid grid-cols-2 gap-2">
        {AMOUNT_TIERS.map(tier => {
          const isSelected = tier.id === selected.id;
          const trxAmt     = trxPerUsd > 0 ? usdToTrx(tier.priceUSD, trxPerUsd).toFixed(0) : "—";

          return (
            <button
              key={tier.id}
              onClick={() => onSelect(tier)}
              className={cn(
                "relative flex flex-col items-start p-3 rounded-xl border transition-all text-left",
                isSelected
                  ? "border-[var(--accent)] bg-[var(--accent-dim)] shadow-[0_0_0_1px_var(--accent)]"
                  : "border-[var(--border)] bg-[var(--bg-card2)] hover:border-[var(--border-alt)]"
              )}
            >
              <span className={cn(
                "text-sm font-bold mono",
                isSelected ? "text-[var(--accent)]" : "text-[var(--text)]"
              )}>
                {formatAmount(tier.amount)} TETHER
              </span>
              <span className="text-xs text-[var(--text-muted)] mt-0.5">
                from ${tier.priceUSD} · ~{trxAmt} TRX
              </span>
              {tier.badge && (
                <span className={cn(
                  "absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full",
                  isSelected
                    ? "bg-[var(--accent)] text-black font-semibold"
                    : "bg-[var(--border)] text-[var(--text-muted)]"
                )}>
                  {tier.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
