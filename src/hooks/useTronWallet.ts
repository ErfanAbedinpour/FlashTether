"use client";

import { useState, useEffect, useCallback } from "react";

export type WalletState =
  | "not_installed"
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export interface TronWalletInfo {
  state: WalletState;
  address: string | null;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendTrx: (toAddress: string, amountSun: number) => Promise<string>;
}

declare global {
  interface Window {
    tronWeb?: {
      defaultAddress: { base58: string | false };
      isConnected: () => boolean;
      trx: {
        sendTransaction: (to: string, amount: number) => Promise<{ txid?: string; transaction?: { txID?: string } }>;
      };
    };
    tronLink?: {
      request: (opts: { method: string }) => Promise<string[]>;
    };
  }
}

export function useTronWallet(): TronWalletInfo {
  const [state,   setState]   = useState<WalletState>("disconnected");
  const [address, setAddress] = useState<string | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  // Detect on mount
  useEffect(() => {
    const check = () => {
      if (typeof window === "undefined") return;

      if (!window.tronLink && !window.tronWeb) {
        setState("not_installed");
        return;
      }

      const addr = window.tronWeb?.defaultAddress?.base58;
      if (addr && typeof addr === "string") {
        setState("connected");
        setAddress(addr);
      } else {
        setState("disconnected");
      }
    };

    check();

    // TronLink fires this event when account changes
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.message?.action === "accountsChanged" ||
          e.data?.message?.action === "setAccount") {
        check();
      }
      if (e.data?.message?.action === "disconnect") {
        setState("disconnected");
        setAddress(null);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    setState("connecting");

    try {
      if (!window.tronLink) {
        throw new Error("TronLink not installed. Please install the TronLink browser extension.");
      }

      // Request account access
      await window.tronLink.request({ method: "tron_requestAccounts" });

      // Brief wait for tronWeb to populate
      await new Promise(r => setTimeout(r, 500));

      const addr = window.tronWeb?.defaultAddress?.base58;
      if (!addr || typeof addr !== "string") {
        throw new Error("Could not get address from TronLink. Did you approve the connection?");
      }

      setState("connected");
      setAddress(addr);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Connection failed";
      setError(msg);
      setState("error");
    }
  }, []);

  const disconnect = useCallback(() => {
    setState("disconnected");
    setAddress(null);
    setError(null);
  }, []);

  const sendTrx = useCallback(async (toAddress: string, amountSun: number): Promise<string> => {
    if (!window.tronWeb) throw new Error("TronLink not connected");

    const result = await window.tronWeb.trx.sendTransaction(toAddress, amountSun);

    // TronLink returns different shapes depending on version
    const txid = result?.txid ?? result?.transaction?.txID;
    if (!txid) throw new Error("Transaction failed — no txid returned");

    return txid;
  }, []);

  return { state, address, error, connect, disconnect, sendTrx };
}
