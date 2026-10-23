"use client";

import { motion } from "framer-motion";
import { FlaskConical, Code2, Timer, Plug, Beaker } from "lucide-react";

const CASES = [
  {
    icon: FlaskConical,
    title: "Testing & Development",
    desc: "Test dApp integrations, smart contracts, and wallet interfaces with realistic token balances — without spending mainnet funds.",
  },
  {
    icon: Code2,
    title: "API Integration Testing",
    desc: "Validate exchange APIs, trading bots, and portfolio trackers with simulated high-value balances on Nile testnet.",
  },
  {
    icon: Timer,
    title: "Temporary Visibility",
    desc: "Time-limited token display for screenshots, demos, and short-term verification needs. Expires automatically.",
  },
  {
    icon: Plug,
    title: "Wallet Interface Testing",
    desc: "Check how wallets display TRC20 token balances, transaction history, and expiry behavior across different clients.",
  },
  {
    icon: Beaker,
    title: "Smart Contract Research",
    desc: "Study timestamp-gated balanceOf patterns, auto-expiry mechanics, and non-transferable token architecture.",
  },
];

export function UseCases() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-[var(--text)] mb-3">Use Cases</h2>
          <p className="text-[var(--text-muted)] text-sm max-w-xl mx-auto">
            Flash TETHER is designed for legitimate testnet development and research workflows.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CASES.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="glass rounded-xl p-5 space-y-3 hover:border-[var(--border-alt)] transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-[var(--accent-dim)] flex items-center justify-center">
                <c.icon className="w-5 h-5 text-[var(--accent)]" />
              </div>
              <h3 className="font-semibold text-sm text-[var(--text)]">{c.title}</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">{c.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
