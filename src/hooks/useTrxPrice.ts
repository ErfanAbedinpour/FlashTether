"use client";

import { useState, useEffect, useCallback } from "react";
import { PRICE_REFRESH_MS } from "@/lib/constants";

export interface TrxPriceData {
  usdPerTrx: number;
  updatedAt: string | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useTrxPrice(): TrxPriceData {
  const [usdPerTrx,  setUsdPerTrx]  = useState<number>(0.12); // sensible fallback
  const [updatedAt,  setUpdatedAt]  = useState<string | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  const fetchPrice = useCallback(async () => {
    try {
      const res  = await fetch("/api/trx-price");
      const data = await res.json() as { usd: number; updatedAt: string };
      setUsdPerTrx(data.usd);
      setUpdatedAt(data.updatedAt);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Price fetch failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, PRICE_REFRESH_MS);
    return () => clearInterval(interval);
  }, [fetchPrice]);

  return { usdPerTrx, updatedAt, loading, error, refresh: fetchPrice };
}
