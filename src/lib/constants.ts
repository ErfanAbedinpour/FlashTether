// ─── Flash amount tiers ───────────────────────────────────────────────────

export interface AmountTier {
  id: string;
  label: string;       // "50K TETHER"
  amount: number;      // raw units (50_000)
  priceUSD: number;    // $50
  badge?: string;      // "Best for demos"
}

export const AMOUNT_TIERS: AmountTier[] = [
  { id: "50k",  label: "50K TETHER",  amount: 50_000,    priceUSD: 50,  badge: "Perfect for testing" },
  { id: "100k", label: "100K TETHER", amount: 100_000,   priceUSD: 80,  badge: "Best for demos" },
  { id: "500k", label: "500K TETHER", amount: 500_000,   priceUSD: 190, badge: "For serious proofs" },
  { id: "1m",   label: "1M TETHER",   amount: 1_000_000, priceUSD: 310, badge: "Maximum impact" },
];

// ─── Duration options ─────────────────────────────────────────────────────

export interface DurationOption {
  id: string;
  label: string;
  seconds: number;
}

export const DURATION_OPTIONS: DurationOption[] = [
  { id: "1h",   label: "1 Hour",   seconds: 3_600 },
  { id: "6h",   label: "6 Hours",  seconds: 21_600 },
  { id: "12h",  label: "12 Hours", seconds: 43_200 },
  { id: "24h",  label: "24 Hours", seconds: 86_400 },
  { id: "3d",   label: "3 Days",   seconds: 259_200 },
  { id: "7d",   label: "7 Days",   seconds: 604_800 },
  { id: "14d",  label: "14 Days",  seconds: 1_209_600 },
  { id: "30d",  label: "30 Days",  seconds: 2_592_000 },
  { id: "60d",  label: "60 Days",  seconds: 5_184_000 },
  { id: "90d",  label: "90 Days",  seconds: 7_776_000 },
  { id: "180d", label: "180 Days", seconds: 15_552_000 },
  { id: "365d", label: "1 Year",   seconds: 31_536_000 },
];

// ─── Network config ───────────────────────────────────────────────────────

export const NILE_CONFIG = {
  fullHost:     "https://api.trongrid.io",      // mainnet
  solidityNode: "https://api.trongrid.io",
  eventServer:  "https://api.trongrid.io",
  tronscanBase: "https://tronscan.org/#/transaction",
  faucet: "",
  chainId: "0x2b6653dc",                        // mainnet chain id
};

// ─── Token meta ───────────────────────────────────────────────────────────

export const TOKEN = {
  name:     "Tether USD",
  symbol:   "TETHER",
  decimals: 6,
};

// ─── Payment slippage tolerance ───────────────────────────────────────────

export const PAYMENT_SLIPPAGE = 0.05; // ±5%

// ─── Polling config ───────────────────────────────────────────────────────

export const TX_POLL_INTERVAL_MS  = 3_000;   // poll every 3s
export const TX_POLL_TIMEOUT_MS   = 180_000; // give up after 3 min
export const PRICE_REFRESH_MS     = 30_000;  // refresh TRX price every 30s
