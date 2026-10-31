import { NextRequest, NextResponse } from "next/server";
import { callFlashMint, validateTronAddress } from "@/lib/tron";
import { txStore } from "@/lib/tx-store";
import { NILE_CONFIG, TOKEN } from "@/lib/constants";
import { truncateAddress, formatDuration } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      targetAddress?: string;
      flashAmount?: number;
      durationSeconds?: number;
    };

    const { targetAddress, flashAmount, durationSeconds } = body;

    // ── Validate inputs ────────────────────────────────────────────────────
    if (!targetAddress || typeof targetAddress !== "string") {
      return NextResponse.json({ success: false, error: "Missing targetAddress" }, { status: 400 });
    }
    if (!flashAmount || typeof flashAmount !== "number" || flashAmount <= 0) {
      return NextResponse.json({ success: false, error: "Invalid flashAmount" }, { status: 400 });
    }
    if (!durationSeconds || typeof durationSeconds !== "number" || durationSeconds <= 0) {
      return NextResponse.json({ success: false, error: "Invalid durationSeconds" }, { status: 400 });
    }

    // ── Validate Tron address ──────────────────────────────────────────────
    try {
      validateTronAddress(targetAddress);
    } catch {
      return NextResponse.json({ success: false, error: "Invalid Tron address" }, { status: 400 });
    }

    // ── Call flashMint on contract ─────────────────────────────────────────
    const amountBaseUnits = flashAmount * Math.pow(10, 6); // 6 decimals
    const mintTxHash = await callFlashMint(targetAddress, amountBaseUnits, durationSeconds);

    // ── Record in store ────────────────────────────────────────────────────
    const now       = Date.now();
    const expiresAt = now + durationSeconds * 1000;
    const fakeRef   = `direct-${now}`;

    txStore.add({
      txHash:          fakeRef,
      mintTxHash,
      targetAddress,
      targetTruncated: truncateAddress(targetAddress),
      amount:          flashAmount,
      durationSeconds,
      durationLabel:   formatDuration(durationSeconds),
      timestamp:       now,
      expiresAt,
      status:          "active",
    });

    const contractAddr = process.env.FLASH_CONTRACT_ADDRESS ?? "";

    return NextResponse.json({
      success:         true,
      mintTxHash,
      contractAddress: contractAddr,
      tronscanUrl:     `${NILE_CONFIG.tronscanBase}/${mintTxHash}`,
      expiresAt,
      token:           TOKEN.symbol,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[flash-mint]", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
