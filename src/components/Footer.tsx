import { Zap, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] py-10 px-4 mt-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-black" />
            </div>
            <span className="font-bold text-sm">
              Flash<span className="text-[var(--accent)]">TETHER</span>
            </span>
            <span className="text-[var(--text-muted)] text-xs">· v1.0.0</span>
          </div>

          {/* Network badge */}
          <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[var(--border)] bg-[var(--bg-card2)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              Nile Testnet Only
            </span>
            <a
              href="https://nileex.io/join/getJoinPage"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--accent)] transition-colors flex items-center gap-1"
            >
              Faucet <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://nile.tronscan.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--accent)] transition-colors flex items-center gap-1"
            >
              Tronscan <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Copy */}
          <p className="text-xs text-[var(--text-muted)]">
            © 2026 FlashTETHER · Testnet only · No real value
          </p>
        </div>
      </div>
    </footer>
  );
}
