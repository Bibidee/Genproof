/**
 * Lenient GenLayer calldata decoder.
 *
 * The official genlayer-js `decode()` throws "some data left" when the RPC
 * response contains extra trailing bytes after the main encoded value (e.g.
 * a trailing newline or null byte appended by the GenLayer Studionet).
 *
 * This module re-implements the same algorithm from genlayer-js source but
 * does NOT enforce "all bytes consumed", so trailing bytes are silently ignored.
 *
 * Constants and algorithm taken verbatim from:
 *   node_modules/genlayer-js/dist/index.js  (src/abi/calldata/*)
 */

const BITS_IN_TYPE = 3;
const TYPE_SPECIAL = 0;
const TYPE_PINT = 1;
const TYPE_NINT = 2;
const TYPE_BYTES = 3;
const TYPE_STR = 4;
const TYPE_ARR = 5;
const TYPE_MAP = 6;
const SPECIAL_NULL = (0 << BITS_IN_TYPE) | TYPE_SPECIAL; // 0
const SPECIAL_FALSE = (1 << BITS_IN_TYPE) | TYPE_SPECIAL; // 8
const SPECIAL_TRUE = (2 << BITS_IN_TYPE) | TYPE_SPECIAL; // 16
const SPECIAL_ADDR = (3 << BITS_IN_TYPE) | TYPE_SPECIAL; // 24

function readULeb128(data: Uint8Array, idx: { i: number }): bigint {
  let res = 0n;
  let accum = 0n;
  let cont = true;
  while (cont) {
    const byte = data[idx.i];
    idx.i++;
    const rest = byte & 127;
    res += BigInt(rest) * (1n << accum);
    accum += 7n;
    cont = byte >= 128;
  }
  return res;
}

function decodeOne(data: Uint8Array, idx: { i: number }): unknown {
  const cur = readULeb128(data, idx);

  if (cur === BigInt(SPECIAL_NULL)) return null;
  if (cur === BigInt(SPECIAL_TRUE)) return true;
  if (cur === BigInt(SPECIAL_FALSE)) return false;
  if (cur === BigInt(SPECIAL_ADDR)) {
    const bytes = data.slice(idx.i, idx.i + 20);
    idx.i += 20;
    return "0x" + Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  const type = Number(cur & 0xffn) & ((1 << BITS_IN_TYPE) - 1);
  const rest = cur >> BigInt(BITS_IN_TYPE);

  switch (type) {
    case TYPE_BYTES: {
      const bytes = data.slice(idx.i, idx.i + Number(rest));
      idx.i += Number(rest);
      return bytes;
    }
    case TYPE_PINT:
      return rest;
    case TYPE_NINT:
      return -1n - rest;
    case TYPE_STR: {
      const bytes = data.slice(idx.i, idx.i + Number(rest));
      idx.i += Number(rest);
      return new TextDecoder("utf-8").decode(bytes);
    }
    case TYPE_ARR: {
      const arr: unknown[] = [];
      let elems = rest;
      while (elems > 0n) {
        elems--;
        arr.push(decodeOne(data, idx));
      }
      return arr;
    }
    case TYPE_MAP: {
      const map = new Map<string, unknown>();
      let elems = rest;
      while (elems > 0n) {
        elems--;
        const keyLen = Number(readULeb128(data, idx));
        const keyBytes = data.slice(idx.i, idx.i + keyLen);
        idx.i += keyLen;
        const key = new TextDecoder("utf-8").decode(keyBytes);
        map.set(key, decodeOne(data, idx));
      }
      return map;
    }
    default:
      throw new Error(`decodeLax: unknown type ${type} at byte ${idx.i}`);
  }
}

/**
 * Decode one value from GenLayer calldata bytes.
 * Extra trailing bytes after the first complete value are silently ignored.
 */
export function decodeLax(data: Uint8Array): unknown {
  if (data.length === 0) return null;
  const idx = { i: 0 };
  return decodeOne(data, idx);
}
