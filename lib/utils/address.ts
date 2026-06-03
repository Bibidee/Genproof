import { getAddress, isAddress } from "viem";

/**
 * Convert any EVM address representation (lowercase, uppercase, partially-checksummed)
 * into its canonical EIP-55 checksummed form.
 *
 * Why this exists:
 *   - The deployed GenProofRegistry stores `user_badges[wallet]`, `user_profiles[wallet]`,
 *     `event_submissions[event_id]`, etc. keyed by whatever string `gl.message.sender_address`
 *     returns — which is the EIP-55 checksummed address.
 *   - MetaMask's `eth_requestAccounts` returns the same address LOWERCASED.
 *   - Next.js URL params are also typed/pasted lowercase.
 *   - TreeMap key lookups in the contract are case-sensitive strings, so a lowercase
 *     query against a checksummed key returns nothing.
 *
 * Every wallet address that crosses the boundary into a contract call OR a JSX comparison
 * must pass through this function first.
 *
 * Returns the original input unchanged if it's not a valid 0x-prefixed 20-byte hex string,
 * so callers can safely pass URL params without try/catch.
 */
export function toChecksum(address: string | undefined | null): string {
  if (!address) return "";
  try {
    if (!isAddress(address)) return address;
    return getAddress(address);
  } catch {
    return address;
  }
}

/**
 * Compare two EVM addresses for equality, normalising both to EIP-55 first.
 * Safe to call with empty / undefined / invalid input — returns false.
 */
export function isSameAddress(
  a: string | undefined | null,
  b: string | undefined | null
): boolean {
  if (!a || !b) return false;
  return toChecksum(a) === toChecksum(b);
}
