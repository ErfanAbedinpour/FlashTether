"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "What happens when the duration expires?",
    a: "The flash balance automatically becomes 0. The FlashTETHER contract's balanceOf() returns 0 for any account past its expiry timestamp. No transaction is needed — wallets see zero the moment they query after expiry.",
  },
  {
    q: "Which wallets are supported?",
    a: "Any wallet that supports TRC20 tokens on Tron — TronLink, TokenPocket, Trust Wallet (Tron network), or any wallet reading standard balanceOf(). Add the FlashTETHER contract address as a custom token.",
  },
  {
    q: "Is this on mainnet?",
    a: "No — Flash TETHER runs exclusively on the Tron Nile testnet. Test TRX has zero real-world value. Never send mainnet TRX to this system.",
  },
  {
    q: "Can I transfer the flash tokens?",
    a: "No. FlashTETHER tokens are non-transferable by design. The transfer() and transferFrom() functions revert with 'tokens are non-transferable'. They exist only as visible balances for testing.",
  },
  {
    q: "How do I deploy the contract?",
    a: "Compile FlashTETHER.sol (Solidity 0.8+) via TronIDE or tronbox, deploy to Nile testnet with your owner wallet, then paste the contract address in .env.local.",
  },
  {
    q: "How fast does the flash appear?",
    a: "After payment is confirmed on Nile and the backend calls flashMint(), the balance appears within 30–60 seconds depending on block confirmation time.",
  },
];

function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="glass rounded-xl overflow-hidden"
    >
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium text-[var(--text)] hover:text-[var(--accent)] transition-colors"
      >
        {q}
        <ChevronDown className={cn(
          "w-4 h-4 text-[var(--text-muted)] transition-transform duration-200 shrink-0 ml-3",
          open && "rotate-180 text-[var(--accent)]"
        )} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{  height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-4 text-xs text-[var(--text-muted)] leading-relaxed">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FAQ() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-[var(--text)] text-center mb-10">
          Frequently Asked Questions
        </h2>
        <div className="space-y-2">
          {FAQS.map((item, i) => (
            <FAQItem key={i} q={item.q} a={item.a} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
