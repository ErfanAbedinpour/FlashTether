"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, X, Loader2, Wallet } from "lucide-react";
import { cn, copyToClipboard, usdToTrx, trxToSun } from "@/lib/utils";
import { useTronWallet } from "@/hooks/useTronWallet";
import { useTrxPrice } from "@/hooks/useTrxPrice";
import { TX_POLL_INTERVAL_MS, TX_POLL_TIMEOUT_MS } from "@/lib/constants";
import type { FlashGeneratorState } from "@/hooks/useFlashGenerator";

interface Props {
  gen:     FlashGeneratorState;
  onClose: () => void;
}

type Tab = "wallet" | "direct";

export function PaymentModal({ gen, onClose }: Props) {
  const [tab,        setTab]        = useState<Tab>("wallet");
  const [copied,     setCopied]     = useState<"addr" | "amount" | null>(null);
  const [manualHash, setManualHash] = useState("");
  const [sending,    setSending]    = useState(false);
  const [sendError,  setSendError]  = useState<string | null>(null);

  const wallet       = useTronWallet();
  const { usdPerTrx } = useTrxPrice();

  const priceUSD    = gen.selectedTier.priceUSD;
  const priceTRX    = usdPerTrx > 0 ? usdToTrx(priceUSD, usdPerTrx) : 0;
  const priceSUN    = trxToSun(priceTRX);
  const receiverAddr = process.env.NEXT_PUBLIC_RECEIVER_ADDRESS ?? "TReceiverAddressHere";

  const handleCopy = async (text: string, key: "addr" | "amount") => {
    await copyToClipboard(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  };

  // ── TronLink auto-send ────────────────────────────────────────────────
  const handleTronLinkPay = async () => {
    setSendError(null);
    setSending(true);

    try {
      if (wallet.state !== "connected") {
        await wallet.connect();
      }

      const txHash = await wallet.sendTrx(receiverAddr, priceSUN);
      // Hand off to the generator state machine
      await gen.submitPaymentHash(txHash, usdPerTrx);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Transaction failed");
      setSending(false);
    }
  };

  // ── Manual hash submit ────────────────────────────────────────────────
  const handleManualSubmit = async () => {
    if (!manualHash.trim()) return;
    setSending(true);
    setSendError(null);
    await gen.submitPaymentHash(manualHash.trim(), usdPerTrx);
    setSending(false);
  };

  // Close modal if we leave awaiting_payment stage
  useEffect(() => {
    if (gen.stage !== "awaiting_payment" && gen.stage !== "configuring") {
      // Parent handles stages — modal stays visible but controlled from outside
    }
  }, [gen.stage]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1,    opacity: 1, y:  0 }}
          exit={{    scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="glass rounded-2xl w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
            <h3 className="font-semibold text-[var(--text)]">Payment</h3>
            <button
              onClick={onClose}
              className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Summary */}
          <div className="px-6 py-4 bg-[var(--bg-card2)] border-b border-[var(--border)] text-sm space-y-1">
            <SummaryRow label="Flash TETHER Amount" value={`${gen.selectedTier.amount.toLocaleString()} TETHER`} />
            <SummaryRow label="Network"             value="Tron Nile Testnet" accent />
            <SummaryRow label="Duration"            value={gen.selectedDuration.label} />
            <SummaryRow label="Price"               value={`~${priceTRX.toFixed(2)} TRX ($${priceUSD})`} bold />
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[var(--border)]">
            {(["wallet", "direct"] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "flex-1 py-3 text-sm font-medium transition-colors capitalize",
                  tab === t
                    ? "text-[var(--accent)] border-b-2 border-[var(--accent)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-mid)]"
                )}
              >
                {t === "wallet" ? "TronLink" : "Direct Transfer"}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-6">
            {tab === "wallet" ? (
              <div className="space-y-4">
                <p className="text-sm text-[var(--text-muted)]">
                  Connect TronLink and confirm the TRX transfer. Flash generation
                  starts automatically after confirmation.
                </p>

                {wallet.state !== "connected" && (
                  <div className="text-xs text-[var(--yellow)] bg-yellow-900/20 border border-yellow-700/30 rounded-lg px-3 py-2">
                    Wallet not connected — click below to connect first.
                  </div>
                )}

                {sendError && (
                  <div className="text-xs text-[var(--red)] bg-red-900/20 border border-red-700/30 rounded-lg px-3 py-2">
                    {sendError}
                  </div>
                )}

                <button
                  onClick={handleTronLinkPay}
                  disabled={sending}
                  className={cn(
                    "w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2",
                    sending
                      ? "bg-[var(--bg-card2)] text-[var(--text-muted)] cursor-wait"
                      : "bg-[var(--accent)] text-black hover:opacity-90"
                  )}
                >
                  {sending ? (
                    <><Loader2 className="w-4 h-4 spin" /> Processing…</>
                  ) : (
                    <><Wallet className="w-4 h-4" />
                      {wallet.state === "connected" ? `Pay ${priceTRX.toFixed(2)} TRX` : "Connect & Pay"}
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-[var(--text-muted)]">
                  Send the exact amount to the address below, then paste the tx hash.
                </p>

                {/* QR */}
                <div className="flex justify-center">
                  <div className="p-3 bg-white rounded-xl">
                    <QRCodeSVG
                      value={receiverAddr}
                      size={140}
                      fgColor="#000000"
                      bgColor="#ffffff"
                    />
                  </div>
                </div>

                {/* Address copy */}
                <CopyField
                  label="Receiver Address"
                  value={receiverAddr}
                  copied={copied === "addr"}
                  onCopy={() => handleCopy(receiverAddr, "addr")}
                />

                {/* Amount copy */}
                <CopyField
                  label={`Send Exactly (TRX)`}
                  value={priceTRX.toFixed(6)}
                  copied={copied === "amount"}
                  onCopy={() => handleCopy(priceTRX.toFixed(6), "amount")}
                />

                {/* Paste tx hash */}
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1.5">
                    Paste Transaction Hash after sending
                  </label>
                  <input
                    type="text"
                    placeholder="tx hash…"
                    value={manualHash}
                    onChange={e => setManualHash(e.target.value.trim())}
                    className="w-full bg-[var(--bg-card2)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-xs mono text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-alt)]"
                  />
                </div>

                <button
                  onClick={handleManualSubmit}
                  disabled={!manualHash.trim() || sending}
                  className={cn(
                    "w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2",
                    manualHash.trim() && !sending
                      ? "bg-[var(--accent)] text-black hover:opacity-90"
                      : "bg-[var(--bg-card2)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--border)]"
                  )}
                >
                  {sending
                    ? <><Loader2 className="w-4 h-4 spin" /> Verifying…</>
                    : "Verify & Generate Flash"
                  }
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function SummaryRow({ label, value, accent, bold }: {
  label: string; value: string; accent?: boolean; bold?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-[var(--text-muted)] text-xs">{label}</span>
      <span className={cn(
        "text-xs mono",
        accent && "text-[var(--accent)]",
        bold   && "text-[var(--text)] font-bold",
        !accent && !bold && "text-[var(--text-mid)]"
      )}>{value}</span>
    </div>
  );
}

function CopyField({ label, value, copied, onCopy }: {
  label: string; value: string; copied: boolean; onCopy: () => void;
}) {
  return (
    <div>
      <label className="block text-xs text-[var(--text-muted)] mb-1.5">{label}</label>
      <div className="flex items-center gap-2 bg-[var(--bg-card2)] border border-[var(--border)] rounded-xl px-3 py-2.5">
        <span className="flex-1 text-xs mono text-[var(--text)] truncate">{value}</span>
        <button
          onClick={onCopy}
          className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-[var(--accent)]" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
