import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Truncate a Tron address: TNxxx…xxx */
export function truncateAddress(addr: string, head = 6, tail = 4): string {
  if (!addr || addr.length <= head + tail) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

/** Format large numbers: 1000000 → "1M", 50000 → "50K" */
export function formatAmount(n: number): string {
  if (n >= 1_000_000) return `${n / 1_000_000}M`;
  if (n >= 1_000)     return `${n / 1_000}K`;
  return String(n);
}

/** Format seconds into HH:MM:SS */
export function formatCountdown(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(v => String(v).padStart(2, "0")).join(":");
}

/** Format a duration in seconds to a human label: 3600 → "1 Hour" */
export function formatDuration(seconds: number): string {
  if (seconds >= 86_400 * 7)  return `${Math.round(seconds / 86400 / 7)} Days`;
  if (seconds >= 86_400)      return `${Math.round(seconds / 86400)} Day${seconds >= 172800 ? 's' : ''}`;
  if (seconds >= 3_600)       return `${Math.round(seconds / 3600)} Hour${seconds >= 7200 ? 's' : ''}`;
  return `${Math.round(seconds / 60)} Minutes`;
}

/** Convert USD to TRX given price */
export function usdToTrx(usd: number, trxPriceUsd: number): number {
  return usd / trxPriceUsd;
}

/** Convert TRX to SUN (1 TRX = 1,000,000 SUN) */
export function trxToSun(trx: number): number {
  return Math.round(trx * 1_000_000);
}

/** Copy text to clipboard */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Validate a Tron address (starts with T, 34 chars, base58) */
export function isValidTronAddress(addr: string): boolean {
  return /^T[A-HJ-NP-Za-km-z1-9]{33}$/.test(addr);
}
