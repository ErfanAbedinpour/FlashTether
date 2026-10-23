"use client";

import { useState, useCallback } from "react";
import { AMOUNT_TIERS, DURATION_OPTIONS, TX_POLL_INTERVAL_MS, TX_POLL_TIMEOUT_MS } from "@/lib/constants";
import { trxToSun, usdToTrx } from "@/lib/utils";
import type { AmountTier, DurationOption } from "@/lib/constants";

// ─── State machine ────────────────────────────────────────────────────────

export type GeneratorStage =
  | "idle"
  | "configuring"
  | "awaiting_payment"
  | "verifying"
  | "minting"
  | "success"
  | "error";

export interface MintResult {
  mintTxHash: string;
  contractAddress: string;
  tronscanUrl: string;
  expiresAt: number;
}

export interface FlashGeneratorState {
  stage: GeneratorStage;
  selectedTier: AmountTier;
  selectedDuration: DurationOption;
  targetAddress: string;
  priceInTrx: number;
  priceInSun: number;
  paymentTxHash: string;
  mintResult: MintResult | null;
  errorMessage: string | null;

  // actions
  selectTier: (tier: AmountTier) => void;
  selectDuration: (dur: DurationOption) => void;
  setTargetAddress: (addr: string) => void;
  openPayment: () => void;
  submitPaymentHash: (txHash: string, trxPriceUsd: number) => Promise<void>;
  reset: () => void;
}

export function useFlashGenerator(): FlashGeneratorState {
  const [stage,            setStage]            = useState<GeneratorStage>("configuring");
  const [selectedTier,     setSelectedTier]     = useState<AmountTier>(AMOUNT_TIERS[1]); // 100K default
  const [selectedDuration, setSelectedDuration] = useState<DurationOption>(DURATION_OPTIONS[3]); // 24h default
  const [targetAddress,    setTargetAddress]    = useState("");
  const [priceInTrx,       setPriceInTrx]       = useState(0);
  const [priceInSun,       setPriceInSun]       = useState(0);
  const [paymentTxHash,    setPaymentTxHash]    = useState("");
  const [mintResult,       setMintResult]       = useState<MintResult | null>(null);
  const [errorMessage,     setErrorMessage]     = useState<string | null>(null);

  const selectTier = useCallback((tier: AmountTier) => {
    setSelectedTier(tier);
  }, []);

  const selectDuration = useCallback((dur: DurationOption) => {
    setSelectedDuration(dur);
  }, []);

  const openPayment = useCallback(() => {
    setStage("awaiting_payment");
  }, []);

  /**
   * Called when user submits a payment tx hash (either from TronLink auto or manual paste).
   * Runs the full verify → mint pipeline.
   */
  const submitPaymentHash = useCallback(async (
    txHash: string,
    trxPriceUsd: number
  ) => {
    setPaymentTxHash(txHash);
    setErrorMessage(null);

    // ── Calculate expected SUN ─────────────────────────────────────────────
    const trxAmount = usdToTrx(selectedTier.priceUSD, trxPriceUsd);
    const sunAmount = trxToSun(trxAmount);
    setPriceInTrx(trxAmount);
    setPriceInSun(sunAmount);

    const receiver = process.env.NEXT_PUBLIC_RECEIVER_ADDRESS ?? "";

    // ── Poll until tx confirmed (up to TX_POLL_TIMEOUT_MS) ────────────────
    setStage("verifying");

    const deadline  = Date.now() + TX_POLL_TIMEOUT_MS;
    let verified    = false;
    let verifyError = "";

    while (Date.now() < deadline) {
      try {
        const vRes  = await fetch("/api/verify-payment", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            txHash,
            expectedAmountSun: sunAmount,
            receiverAddress:   receiver,
          }),
        });
        const vData = await vRes.json() as { valid: boolean; error?: string };

        if (vData.valid) {
          verified = true;
          break;
        }

        // TX not found yet — keep polling
        if (vData.error?.includes("not found") || vData.error?.includes("not successful")) {
          await new Promise(r => setTimeout(r, TX_POLL_INTERVAL_MS));
          continue;
        }

        // Hard failure (wrong receiver, underpaid, etc.)
        verifyError = vData.error ?? "Payment verification failed";
        break;
      } catch {
        await new Promise(r => setTimeout(r, TX_POLL_INTERVAL_MS));
      }
    }

    if (!verified) {
      setErrorMessage(verifyError || "Payment verification timed out. Check tx hash and try again.");
      setStage("error");
      return;
    }

    // ── Mint ───────────────────────────────────────────────────────────────
    setStage("minting");

    try {
      const mRes  = await fetch("/api/flash-mint", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          targetAddress:    targetAddress,
          flashAmount:      selectedTier.amount,
          durationSeconds:  selectedDuration.seconds,
          paymentTxHash:    txHash,
          expectedAmountSun: sunAmount,
        }),
      });

      const mData = await mRes.json() as {
        success: boolean;
        mintTxHash?: string;
        contractAddress?: string;
        tronscanUrl?: string;
        expiresAt?: number;
        error?: string;
      };

      if (!mData.success) {
        throw new Error(mData.error ?? "Mint failed");
      }

      setMintResult({
        mintTxHash:      mData.mintTxHash!,
        contractAddress: mData.contractAddress!,
        tronscanUrl:     mData.tronscanUrl!,
        expiresAt:       mData.expiresAt!,
      });

      setStage("success");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Mint failed");
      setStage("error");
    }
  }, [selectedTier, selectedDuration, targetAddress]);

  const reset = useCallback(() => {
    setStage("configuring");
    setPaymentTxHash("");
    setMintResult(null);
    setErrorMessage(null);
    setPriceInTrx(0);
    setPriceInSun(0);
  }, []);

  return {
    stage,
    selectedTier,
    selectedDuration,
    targetAddress,
    priceInTrx,
    priceInSun,
    paymentTxHash,
    mintResult,
    errorMessage,
    selectTier,
    selectDuration,
    setTargetAddress,
    openPayment,
    submitPaymentHash,
    reset,
  };
}
