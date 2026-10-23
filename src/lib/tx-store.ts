/**
 * In-memory flash transaction store (MVP — survives process lifetime).
 * Replace with a DB in production.
 */

export interface FlashTx {
  txHash: string;
  mintTxHash: string;
  targetAddress: string;
  targetTruncated: string;
  amount: number;         // TETHER display amount (e.g. 100_000)
  durationSeconds: number;
  durationLabel: string;
  timestamp: number;      // unix ms
  expiresAt: number;      // unix ms
  status: "active" | "expired";
}

class TxStore {
  private txs: FlashTx[] = [];
  private usedPaymentHashes = new Set<string>();

  isPaymentUsed(txHash: string): boolean {
    return this.usedPaymentHashes.has(txHash);
  }

  markPaymentUsed(txHash: string): void {
    this.usedPaymentHashes.add(txHash);
  }

  add(tx: FlashTx): void {
    this.txs.unshift(tx);
    if (this.txs.length > 100) this.txs = this.txs.slice(0, 100);
  }

  getAll(): FlashTx[] {
    const now = Date.now();
    return this.txs
      .map(tx => ({
        ...tx,
        status: now > tx.expiresAt ? "expired" : "active",
      } as FlashTx))
      .slice(0, 20);
  }
}

// Singleton — shared across API route invocations within same process
export const txStore = new TxStore();
