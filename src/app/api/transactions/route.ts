import { NextResponse } from "next/server";
import { txStore } from "@/lib/tx-store";

export async function GET() {
  const txs = txStore.getAll();
  return NextResponse.json({ transactions: txs });
}
