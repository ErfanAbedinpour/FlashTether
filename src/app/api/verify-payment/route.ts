import { NextRequest, NextResponse } from "next/server";
import { verifyTrxPayment } from "@/lib/tron";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      txHash?: string;
      expectedAmountSun?: number;
      receiverAddress?: string;
    };

    const { txHash, expectedAmountSun, receiverAddress } = body;

    if (!txHash || typeof txHash !== "string") {
      return NextResponse.json({ valid: false, error: "Missing txHash" }, { status: 400 });
    }
    if (!expectedAmountSun || typeof expectedAmountSun !== "number") {
      return NextResponse.json({ valid: false, error: "Missing expectedAmountSun" }, { status: 400 });
    }
    if (!receiverAddress || typeof receiverAddress !== "string") {
      return NextResponse.json({ valid: false, error: "Missing receiverAddress" }, { status: 400 });
    }

    const result = await verifyTrxPayment(txHash, expectedAmountSun, receiverAddress);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ valid: false, error: msg }, { status: 500 });
  }
}
