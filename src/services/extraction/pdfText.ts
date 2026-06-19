/* eslint-disable no-bitwise -- byte parsing is inherently bitwise */
import pako from "pako";

import { bytesToLatin1, latin1ToBytes } from "./base64";

/** Decode a PDF literal string `( … )`, resolving escapes and octal codes. */
function decodePdfString(s: string): string {
  let out = "";
  for (let i = 0; i < s.length; i += 1) {
    const c = s.charAt(i);
    if (c !== "\\") {
      out += c;
      continue;
    }
    const n = s.charAt(i + 1);
    if (n === "n") out += "\n";
    else if (n === "r") out += "\r";
    else if (n === "t") out += "\t";
    else if (n === "b" || n === "f") out += " ";
    else if (n === "(" || n === ")" || n === "\\") out += n;
    else if (n === "\n" || n === "\r") {
      i += 1;
      continue; // line continuation
    } else if (n >= "0" && n <= "7") {
      let oct = n;
      let j = i + 2;
      while (j < s.length && oct.length < 3 && s.charAt(j) >= "0" && s.charAt(j) <= "7") {
        oct += s.charAt(j);
        j += 1;
      }
      out += String.fromCharCode(parseInt(oct, 8) & 0xff);
      i = j - 1;
      continue;
    } else {
      out += n;
    }
    i += 1;
  }
  return out;
}

function decodeHexString(hex: string): string {
  const clean = hex.replace(/[^0-9A-Fa-f]/g, "");
  let out = "";
  for (let i = 0; i + 1 < clean.length; i += 2) {
    out += String.fromCharCode(parseInt(clean.slice(i, i + 2), 16));
  }
  return out;
}

/** Pull the visible text out of a (decoded) PDF content stream. */
function extractTextOperators(content: string): string {
  const parts: string[] = [];

  const parenRe = /\((?:\\.|[^\\()])*\)/g;
  let m: RegExpExecArray | null;
  while ((m = parenRe.exec(content)) !== null) {
    parts.push(decodePdfString(m[0].slice(1, -1)));
  }

  const hexRe = /<([0-9A-Fa-f\s]{2,})>/g;
  while ((m = hexRe.exec(content)) !== null) {
    const hx = m[1];
    if (hx) parts.push(decodeHexString(hx));
  }

  return parts.join(" ");
}

/**
 * Best-effort on-device PDF → text. Walks the PDF's stream objects, inflates the
 * FlateDecode ones with pako (most digital factures), and collects text-show operands.
 * Works for digitally-generated, text-based PDFs; scanned/image PDFs yield nothing
 * (no embedded text) and are handled upstream by the vision fallback.
 */
export function extractPdfText(bytes: Uint8Array): string {
  const latin1 = bytesToLatin1(bytes);
  const collected: string[] = [];

  const streamRe = /stream\r?\n/g;
  let m: RegExpExecArray | null;
  while ((m = streamRe.exec(latin1)) !== null) {
    const start = m.index + m[0].length;
    const end = latin1.indexOf("endstream", start);
    if (end < 0) break;

    const data = latin1.slice(start, end).replace(/\r?\n$/, "");
    let text = "";
    try {
      text = bytesToLatin1(pako.inflate(latin1ToBytes(data)));
    } catch {
      text = data; // possibly an uncompressed content stream
    }
    if (text.includes("BT") || text.includes("Tj") || text.includes("TJ")) {
      collected.push(extractTextOperators(text));
    }
    streamRe.lastIndex = end + "endstream".length;
  }

  return collected
    .join("\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}
