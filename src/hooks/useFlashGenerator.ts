"use client";

import { useState, useCallback } from "react";
import { AMOUNT_TIERS, DURATION_OPTIONS } from "@/lib/constants";
import type { AmountTier, DurationOption } from "@/lib/constants";

// ─── State machine ────────────────────────────────────────────────────────

export type GeneratorStage =
  | "configuring"
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
  mintResult: MintResult | null;
  errorMessage: string | null;

  // actions
  selectTier: (tier: AmountTier) => void;
  selectDuration: (dur: DurationOption) => void;
  setTargetAddress: (addr: string) => void;
  mint: () => Promise<void>;
  reset: () => void;
}

export function useFlashGenerator(): FlashGeneratorState {
  const [stage,            setStage]            = useState<GeneratorStage>("configuring");
  const [selectedTier,     setSelectedTier]     = useState<AmountTier>(AMOUNT_TIERS[1]); // 100K default
  const [selectedDuration, setSelectedDuration] = useState<DurationOption>(DURATION_OPTIONS[3]); // 24h default
  const [targetAddress,    setTargetAddress]    = useState("");
  const [mintResult,       setMintResult]       = useState<MintResult | null>(null);
  const [errorMessage,     setErrorMessage]     = useState<string | null>(null);

  const selectTier     = useCallback((tier: AmountTier)     => setSelectedTier(tier),     []);
  const selectDuration = useCallback((dur: DurationOption)  => setSelectedDuration(dur),  []);

  /**
   * Direct mint — no payment step. Calls /api/flash-mint immediately.
   */
  const mint = useCallback(async () => {
    setErrorMessage(null);
    setStage("minting");

    try {
      const res  = await fetch("/api/flash-mint", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          targetAddress:   targetAddress,
          flashAmount:     selectedTier.amount,
          durationSeconds: selectedDuration.seconds,
        }),
      });

      const data = await res.json() as {
        success: boolean;
        mintTxHash?: string;
        contractAddress?: string;
        tronscanUrl?: string;
        expiresAt?: number;
        error?: string;
      };

      if (!data.success) {
        throw new Error(data.error ?? "Mint failed");
      }

      setMintResult({
        mintTxHash:      data.mintTxHash!,
        contractAddress: data.contractAddress!,
        tronscanUrl:     data.tronscanUrl!,
        expiresAt:       data.expiresAt!,
      });

      setStage("success");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Mint failed");
      setStage("error");
    }
  }, [targetAddress, selectedTier, selectedDuration]);

  const reset = useCallback(() => {
    setStage("configuring");
    setMintResult(null);
    setErrorMessage(null);
  }, []);

  return {
    stage,
    selectedTier,
    selectedDuration,
    targetAddress,
    mintResult,
    errorMessage,
    selectTier,
    selectDuration,
    setTargetAddress,
    mint,
    reset,
  };
}
