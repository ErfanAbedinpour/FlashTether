import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=tron&vs_currencies=usd",
      { cache: "no-store" }
    );

    if (!res.ok) {
      throw new Error(`CoinGecko responded with ${res.status}`);
    }

    const data = await res.json() as { tron?: { usd?: number } };
    const usd  = data?.tron?.usd;

    if (!usd || typeof usd !== "number") {
      throw new Error("Invalid CoinGecko response shape");
    }

    return NextResponse.json({
      usd,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { usd: 0.12, updatedAt: new Date().toISOString(), fallback: true, error: msg },
      { status: 200 }
    );
  }
}
