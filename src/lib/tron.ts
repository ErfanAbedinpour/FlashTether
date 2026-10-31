/**
 * Server-side Tron utilities — Nile testnet only.
 * This file must NEVER be imported in client bundles.
 */

import { NILE_CONFIG, PAYMENT_SLIPPAGE } from "./constants";

// ─── TronWeb server instance (lazy) ──────────────────────────────────────

let _tronWebInstance: unknown = null;

export function getServerTronWeb() {
  if (_tronWebInstance) return _tronWebInstance as TronWebInstance;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const TronWebModule = require("tronweb");
  const TronWeb = TronWebModule.TronWeb ?? TronWebModule.default ?? TronWebModule;

  const privateKey = process.env.TRON_PRIVATE_KEY;
  if (!privateKey) throw new Error("TRON_PRIVATE_KEY not set in .env.local");

  _tronWebInstance = new TronWeb({
    fullHost:     NILE_CONFIG.fullHost,
    headers:      { "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY ?? "" },
    privateKey,
  });

  return _tronWebInstance as TronWebInstance;
}

// ─── Address validation ───────────────────────────────────────────────────

export function isValidTronAddress(addr: string): boolean {
  return /^T[A-HJ-NP-Za-km-z1-9]{33}$/.test(addr);
}

export function validateTronAddress(addr: string): void {
  if (!isValidTronAddress(addr)) {
    throw new Error(`Invalid Tron address: ${addr}`);
  }
}

// ─── TronGrid tx verification ────────────────────────────────────────────

export interface TxVerifyResult {
  valid: boolean;
  confirmedAt?: number;
  error?: string;
}

export async function verifyTrxPayment(
  txHash: string,
  expectedAmountSun: number,
  receiverAddress: string
): Promise<TxVerifyResult> {
  const apiKey = process.env.TRONGRID_API_KEY ?? "";

  const url = `${NILE_CONFIG.fullHost}/v1/transactions/${txHash}`;
  const res = await fetch(url, {
    headers: { "TRON-PRO-API-KEY": apiKey },
    cache: "no-store",
  });

  if (!res.ok) {
    return { valid: false, error: `TronGrid returned ${res.status}` };
  }

  const data = await res.json() as TronGridTxResponse;
  const tx   = data?.data?.[0];

  if (!tx) {
    return { valid: false, error: "Transaction not found" };
  }

  // Must be confirmed
  if (tx.ret?.[0]?.contractRet !== "SUCCESS") {
    return { valid: false, error: "Transaction not successful" };
  }

  const contract = tx.raw_data?.contract?.[0];
  if (contract?.type !== "TransferContract") {
    return { valid: false, error: "Not a TRX transfer" };
  }

  const value = contract?.parameter?.value;
  const toAddr  = value?.to_address  ? hexToBase58(value.to_address)  : "";
  const sentSun  = value?.amount ?? 0;

  // Normalize receiver address for comparison
  if (toAddr.toLowerCase() !== receiverAddress.toLowerCase()) {
    return { valid: false, error: "Payment sent to wrong address" };
  }

  // Allow ±PAYMENT_SLIPPAGE tolerance
  const minSun = expectedAmountSun * (1 - PAYMENT_SLIPPAGE);
  if (sentSun < minSun) {
    return {
      valid: false,
      error: `Underpaid: sent ${sentSun} SUN, expected ≥ ${Math.round(minSun)} SUN`,
    };
  }

  const confirmedAt = tx.block_timestamp ?? Date.now();
  return { valid: true, confirmedAt };
}

// ─── Flash mint via contract ──────────────────────────────────────────────

export async function callFlashMint(
  targetAddress: string,
  amountBaseUnits: number,   // amount * 10^6
  durationSeconds: number
): Promise<string> {
  const tronWeb = getServerTronWeb();
  const contractAddr = process.env.FLASH_CONTRACT_ADDRESS;
  if (!contractAddr) throw new Error("FLASH_CONTRACT_ADDRESS not set");

  const { FLASH_TETHER_ABI } = await import("./contract");

  const contract = await tronWeb.contract(FLASH_TETHER_ABI, contractAddr);

  const tx = await contract.flashMint(
    targetAddress,
    amountBaseUnits,
    durationSeconds
  ).send({ feeLimit: 100_000_000 });

  return tx as string; // returns txHash
}

// ─── Hex address ↔ Base58 (Tron) ─────────────────────────────────────────

function hexToBase58(hex: string): string {
  // TronWeb utility — only called server-side
  try {
    const tronWeb = getServerTronWeb();
    return tronWeb.address.fromHex(hex);
  } catch {
    return hex;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────

interface TronWebInstance {
  contract: (abi: unknown, address: string) => Promise<ContractInstance>;
  address: { fromHex: (hex: string) => string };
}

interface ContractInstance {
  flashMint: (
    to: string,
    amount: number,
    duration: number
  ) => { send: (opts: { feeLimit: number }) => Promise<string> };
}

interface TronGridTxResponse {
  data?: Array<{
    ret?: Array<{ contractRet?: string }>;
    block_timestamp?: number;
    raw_data?: {
      contract?: Array<{
        type?: string;
        parameter?: {
          value?: {
            to_address?: string;
            amount?: number;
          };
        };
      }>;
    };
  }>;
}
