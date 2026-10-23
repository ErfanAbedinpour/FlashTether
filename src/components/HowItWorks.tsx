"use client";

import { motion } from "framer-motion";
import { Settings2, CreditCard, Zap } from "lucide-react";

const STEPS = [
  {
    icon:  Settings2,
    step:  "01",
    title: "Configure",
    desc:  "Choose your flash amount (50K–1M TETHER), set the visibility duration (1 hour to 7 days), and enter your Tron wallet address.",
  },
  {
    icon:  CreditCard,
    step:  "02",
    title: "Pay in TRX",
    desc:  "Pay the TRX equivalent via TronLink wallet or direct transfer on the Nile testnet. Payment is verified on-chain via TronGrid.",
  },
  {
    icon:  Zap,
    step:  "03",
    title: "Flash Generated",
    desc:  "The FlashTETHER contract mints a time-gated balance to your address. The balance auto-expires after your chosen duration — no manual burn needed.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 px-4 bg-[var(--bg-card)]/40">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-[var(--text)] mb-3">How Flash TETHER Works</h2>
          <p className="text-[var(--text-muted)] text-sm max-w-xl mx-auto">
            Flash TETHER uses a custom TRC20 contract with timestamp-gated{" "}
            <code className="text-[var(--accent)] mono text-xs">balanceOf</code>.
            Wallets read the standard interface — balance appears real, expires automatically.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.12 }}
              className="relative glass rounded-xl p-6 space-y-4"
            >
              {/* Step number */}
              <div className="absolute -top-3 left-5 mono text-xs font-bold text-[var(--accent)] bg-[var(--bg)] px-2 py-0.5 rounded border border-[var(--border-alt)]">
                {s.step}
              </div>

              <div className="w-10 h-10 rounded-xl bg-[var(--accent-dim)] flex items-center justify-center mt-2">
                <s.icon className="w-5 h-5 text-[var(--accent)]" />
              </div>

              <h3 className="font-semibold text-[var(--text)]">{s.title}</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Contract mechanic callout */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-10 glass-alt rounded-xl p-5 text-sm text-[var(--text-muted)] leading-relaxed"
        >
          <span className="text-[var(--accent)] font-medium">Key mechanic: </span>
          The contract&apos;s <code className="mono text-xs text-[var(--accent)]">balanceOf(account)</code> checks{" "}
          <code className="mono text-xs text-[var(--text-mid)]">block.timestamp {">"} _expiry[account]</code>{" "}
          — if expired, returns <code className="mono text-xs">0</code>. No backend cron needed.
          Tokens are also non-transferable — <code className="mono text-xs">transfer()</code> reverts.
        </motion.div>
      </div>
    </section>
  );
}
