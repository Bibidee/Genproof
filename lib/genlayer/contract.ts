/**
 * Single source of truth for the deployed GenProofRegistry contract address.
 * Set NEXT_PUBLIC_GENPROOF_CONTRACT_ADDRESS in .env.local after deploying.
 */
export function getContractAddress(): `0x${string}` {
  const addr =
    process.env.NEXT_PUBLIC_GENPROOF_CONTRACT_ADDRESS ||
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
    "";
  if (!addr) {
    throw new Error(
      "Contract address not set. Add NEXT_PUBLIC_GENPROOF_CONTRACT_ADDRESS to .env.local"
    );
  }
  return addr as `0x${string}`;
}
