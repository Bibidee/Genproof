/**
 * Wallet network helpers — switch the user's injected wallet (MetaMask, Brave,
 * Rabby, …) to GenLayer Studionet so writes go to the correct chain.
 *
 * Studionet chain id: 61999 = 0xF22F
 */

const STUDIONET_CHAIN_ID_HEX = "0xF22F";

const STUDIONET_PARAMS = {
  chainId: STUDIONET_CHAIN_ID_HEX,
  chainName: "GenLayer Studionet",
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  rpcUrls: ["https://studio.genlayer.com/api"],
  blockExplorerUrls: ["https://explorer-studio.genlayer.com"],
};

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

function getInjected(): EthereumProvider | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { ethereum?: EthereumProvider };
  return w.ethereum ?? null;
}

/**
 * Ask the injected wallet to switch to Studionet. If the wallet doesn't know
 * the chain (error code 4902), add it first, then retry the switch.
 *
 * Silent no-op if there is no injected wallet (we're using a local PK account).
 */
export async function ensureStudionet(): Promise<void> {
  const eth = getInjected();
  if (!eth) return;

  try {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: STUDIONET_CHAIN_ID_HEX }],
    });
  } catch (err) {
    // 4902 = unrecognized chain in MetaMask — add it then it'll be selected automatically.
    const code = (err as { code?: number })?.code;
    if (code === 4902 || /unrecogn/i.test(String((err as Error)?.message ?? ""))) {
      try {
        await eth.request({
          method: "wallet_addEthereumChain",
          params: [STUDIONET_PARAMS],
        });
      } catch {
        // User rejected — let the connect flow continue; reads still work.
      }
    }
    // Any other error (user rejected switch, etc.) is non-fatal for read flows.
  }
}
