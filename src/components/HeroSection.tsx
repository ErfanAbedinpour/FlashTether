"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface StatItem { label: string; value: string; prefix?: string; suffix?: string; }

const STATS: StatItem[] = [
  { label: "Volume",       prefix: "$", value: "2.4B" },
  { label: "Transactions", value: "847K" },
  { label: "Success",      value: "99.9", suffix: "%" },
];

function AnimatedStat({ stat, visible }: { stat: StatItem; visible: boolean }) {
  return (
    <div className="text-center">
      <div className="mono text-2xl sm:text-3xl font-bold text-[var(--accent)]">
        {visible ? (
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {stat.prefix}{stat.value}{stat.suffix}
          </motion.span>
        ) : (
          <span className="opacity-0">{stat.prefix}{stat.value}{stat.suffix}</span>
        )}
      </div>
      <div className="text-xs text-[var(--text-muted)] mt-1 uppercase tracking-widest">
        {stat.label}
      </div>
    </div>
  );
}

export function HeroSection() {
  const ref     = useRef<HTMLDivElement>(null);
  const [vis,   setVis]   = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVis(true); },
      { threshold: 0.3 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="relative py-24 px-4 overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(0,255,136,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Status badge */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y:   0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs
                     bg-[var(--accent-dim)] border border-[var(--border-alt)]
                     text-[var(--accent)] mb-6 mono"
        >
          <span className="pulse-dot" />
          Flash Generator · Ready
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y:  0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-4"
        >
          Instant Flash{" "}
          <span className="gradient-text">TETHER</span>
          <br />
          Generation
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y:  0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-[var(--text-muted)] text-lg max-w-xl mx-auto mb-12"
        >
          Generate temporary TETHER tokens that appear as real balance in any TVM
          wallet — Tron <span className="text-[var(--accent)] font-medium">Nile Testnet</span> only.
        </motion.p>

        {/* Stats */}
        <div ref={ref} className="flex justify-center gap-12 sm:gap-20">
          {STATS.map(s => (
            <AnimatedStat key={s.label} stat={s} visible={vis} />
          ))}
        </div>
      </div>
    </section>
  );
}
