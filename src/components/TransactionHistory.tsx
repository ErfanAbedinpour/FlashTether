"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Clock } from "lucide-react";
import { cn, formatAmount, formatDuration } from "@/lib/utils";
import { NILE_CONFIG } from "@/lib/constants";

interface FlashTx {
  txHash:          string;
  targetTruncated: string;
  amount:          number;
  durationLabel:   string;
  timestamp:       number;
  expiresAt:       number;
  status:          "active" | "expired";
}

export function TransactionHistory() {
  const [txs,     setTxs]     = useState<FlashTx[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTxs = async () => {
    try {
      const res  = await fetch("/api/transactions");
      const data = await res.json() as { transactions: FlashTx[] };
      setTxs(data.transactions ?? []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTxs();
    const interval = setInterval(fetchTxs, 10_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-20 px-4 bg-[var(--bg-card)]/30">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-[var(--text)]">Transaction History</h2>
          <span className="text-xs text-[var(--text-muted)] mono">Live · refreshes every 10s</span>
        </div>

        {loading && (
          <div className="text-center py-16 text-[var(--text-muted)] text-sm">
            <div className="shimmer h-10 rounded-xl mb-2" />
            <div className="shimmer h-10 rounded-xl mb-2" />
            <div className="shimmer h-10 rounded-xl" />
          </div>
        )}

        {!loading && txs.length === 0 && (
          <div className="glass rounded-xl py-16 text-center">
            <Clock className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-3" />
            <p className="text-[var(--text-muted)] text-sm">No transactions yet</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Flash generations will appear here in real time.
            </p>
          </div>
        )}

        {!loading && txs.length > 0 && (
          <div className="glass rounded-xl overflow-hidden">
            <div className="grid grid-cols-5 px-5 py-3 border-b border-[var(--border)] text-xs text-[var(--text-muted)] uppercase tracking-widest">
              <span>Target</span>
              <span>Amount</span>
              <span>Duration</span>
              <span>Status</span>
              <span>Tx</span>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {txs.map((tx, i) => (
                <motion.div
                  key={tx.txHash}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x:  0 }}
                  transition={{ delay: i * 0.04 }}
                  className="grid grid-cols-5 px-5 py-3.5 text-xs items-center hover:bg-[var(--bg-card2)] transition-colors"
                >
                  <span className="mono text-[var(--text-mid)]">{tx.targetTruncated}</span>
                  <span className="mono text-[var(--text)]">{formatAmount(tx.amount)} TETHER</span>
                  <span className="text-[var(--text-muted)]">{tx.durationLabel}</span>
                  <span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-medium",
                      tx.status === "active"
                        ? "bg-[var(--accent-dim)] text-[var(--accent)] border border-[var(--border-alt)]"
                        : "bg-red-900/20 text-[var(--red)] border border-red-700/20"
                    )}>
                      {tx.status === "active" ? "Active" : "Expired"}
                    </span>
                  </span>
                  <span>
                    <a
                      href={`${NILE_CONFIG.tronscanBase}/${tx.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View
                    </a>
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
