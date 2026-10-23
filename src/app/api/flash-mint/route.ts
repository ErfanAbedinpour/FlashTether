import { NextRequest, NextResponse } from "next/server";
import { callFlashMint, validateTronAddress, verifyTrxPayment } from "@/lib/tron";
import { txStore } from "@/lib/tx-store";
import { NILE_CONFIG, TOKEN } from "@/lib/constants";
import { truncateAddress, formatDuration } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      targetAddress?: string;
      flashAmount?: number;
      durationSeconds?: number;
      paymentTxHash?: string;
      expectedAmountSun?: number;
    };

    const { targetAddress, flashAmount, durationSeconds, paymentTxHash, expectedAmountSun } = body;

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
    if (!paymentTxHash || typeof paymentTxHash !== "string") {
      return NextResponse.json({ success: false, error: "Missing paymentTxHash" }, { status: 400 });
    }
    if (!expectedAmountSun || typeof expectedAmountSun !== "number") {
      return NextResponse.json({ success: false, error: "Missing expectedAmountSun" }, { status: 400 });
    }

    // ── Validate Tron address ──────────────────────────────────────────────
    try {
      validateTronAddress(targetAddress);
    } catch {
      return NextResponse.json({ success: false, error: "Invalid Tron address" }, { status: 400 });
    }

    // ── Dedup: same payment can't mint twice ───────────────────────────────
    if (txStore.isPaymentUsed(paymentTxHash)) {
      return NextResponse.json(
        { success: false, error: "Payment already used for a mint" },
        { status: 409 }
      );
    }

    // ── Re-verify payment (double check) ──────────────────────────────────
    const receiverAddress = process.env.RECEIVER_ADDRESS;
    if (!receiverAddress) {
      return NextResponse.json({ success: false, error: "Server misconfiguration" }, { status: 500 });
    }

    const verification = await verifyTrxPayment(
      paymentTxHash,
      expectedAmountSun,
      receiverAddress
    );

    if (!verification.valid) {
      return NextResponse.json(
        { success: false, error: `Payment invalid: ${verification.error}` },
        { status: 402 }
      );
    }

    // ── Call flashMint on contract ─────────────────────────────────────────
    const amountBaseUnits = flashAmount * Math.pow(10, 6); // 6 decimals
    const mintTxHash = await callFlashMint(targetAddress, amountBaseUnits, durationSeconds);

    // ── Record in store ────────────────────────────────────────────────────
    txStore.markPaymentUsed(paymentTxHash);

    const now       = Date.now();
    const expiresAt = now + durationSeconds * 1000;

    txStore.add({
      txHash:          paymentTxHash,
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
