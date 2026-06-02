"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import {
  setClientAccount,
  setClientFromAddress,
  clearClient,
  generatePrivateKey,
} from "@/lib/genlayer/client";

type WalletContextType = {
  address: string | null;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
};

const WalletContext = createContext<WalletContextType>({
  address: null,
  connecting: false,
  connect: async () => {},
  disconnect: () => {},
});

const STORAGE_KEY = "genproof_wallet_pk";

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Restore local-account session on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const account = setClientAccount(stored as `0x${string}`);
        setAddress(account.address);
      }
    } catch {
      // Ignore — browser may not have localStorage in some SSR contexts
    }
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      // ── Option A: Injected wallet (MetaMask, Brave, etc.) ──────────────────
      if (
        typeof window !== "undefined" &&
        (window as unknown as { ethereum?: unknown }).ethereum
      ) {
        try {
          const eth = (
            window as unknown as {
              ethereum: { request: (a: { method: string }) => Promise<string[]> };
            }
          ).ethereum;
          const accounts = await eth.request({ method: "eth_requestAccounts" });
          if (accounts[0]) {
            // Configure the genlayer-js client to use window.ethereum for signing
            setClientFromAddress(accounts[0] as `0x${string}`);
            setAddress(accounts[0]);
            // Don't store a private key — injected wallet manages keys itself
            return;
          }
        } catch {
          // MetaMask rejected / not available — fall through to local account
        }
      }

      // ── Option B: Local simulator account (no MetaMask) ───────────────────
      const pk = generatePrivateKey();
      const account = setClientAccount(pk);
      localStorage.setItem(STORAGE_KEY, pk);
      setAddress(account.address);
    } catch (e) {
      console.error("Wallet connect error:", e);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    clearClient();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
    setAddress(null);
  }, []);

  return (
    <WalletContext.Provider value={{ address, connecting, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
