/* eslint-disable no-bitwise -- byte/base64 math is inherently bitwise */

/** Base64 helpers that don't depend on `atob`/`Buffer` (absent under Hermes). */

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

const LOOKUP: Record<string, number> = {};
for (let i = 0; i < ALPHABET.length; i += 1) {
  const ch = ALPHABET.charAt(i);
  LOOKUP[ch] = i;
}

/** Decode a base64 string into raw bytes. Ignores whitespace and `=` padding. */
export function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, "");
  const len = clean.length;
  const byteLength = Math.floor((len * 3) / 4);
  const out = new Uint8Array(byteLength);

  let outIndex = 0;
  for (let i = 0; i < len; i += 4) {
    const c0 = LOOKUP[clean.charAt(i)] ?? 0;
    const c1 = LOOKUP[clean.charAt(i + 1)] ?? 0;
    const c2 = LOOKUP[clean.charAt(i + 2)] ?? 0;
    const c3 = LOOKUP[clean.charAt(i + 3)] ?? 0;

    const triplet = (c0 << 18) | (c1 << 12) | (c2 << 6) | c3;
    if (outIndex < byteLength) out[outIndex++] = (triplet >> 16) & 0xff;
    if (outIndex < byteLength) out[outIndex++] = (triplet >> 8) & 0xff;
    if (outIndex < byteLength) out[outIndex++] = triplet & 0xff;
  }
  return out;
}

/** Build a latin1 string (1 char per byte) so PDF byte structure can be regex-scanned. */
export function bytesToLatin1(bytes: Uint8Array): string {
  let result = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    const slice = bytes.subarray(i, Math.min(i + chunk, bytes.length));
    result += String.fromCharCode(...slice);
  }
  return result;
}

/** Inverse of {@link bytesToLatin1} — recover bytes from a latin1 substring. */
export function latin1ToBytes(text: string): Uint8Array {
  const out = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i += 1) out[i] = text.charCodeAt(i) & 0xff;
  return out;
}
